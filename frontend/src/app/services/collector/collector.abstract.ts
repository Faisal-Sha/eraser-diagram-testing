import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { I18NEXT_SERVICE, I18NextService } from 'angular-i18next';
import { Inject } from '@angular/core';

interface QueueItem<RequestItem, ResponseItem> {
  requestItem: RequestItem;
  responseResolver: (item: ResponseItem) => void;
}

export abstract class CollectorServiceAbstract<RequestItem, ResponseItem, RequestBody, ResponseBody> {
  protected abstract readonly ENDPOINT: string;

  private collectionQueue: QueueItem<RequestItem, ResponseItem>[] = [];
  private cache: Map<string, {
    responseItem: ResponseItem;
    createdAt: Date;
  }> = new Map();
  private pendingRequests: Map<string, Promise<ResponseItem>> = new Map();
  private handlingQueue = false;

  private debounceTimeout: NodeJS.Timeout | null = null;
  private maxDebounceTimeout: NodeJS.Timeout | null = null;

  protected debounceTime = 150;
  protected maxDebounceTime = 1000;
  protected bottleneck = 20;
  protected cacheSize = 100;

  /**
   * @param httpClient The Angular HttpClient used to make requests
   * @param i18nService The i18next service used for translation
   */
  constructor(
    protected httpClient: HttpClient,
    @Inject(I18NEXT_SERVICE) protected i18nService: I18NextService,
  ) { }

  /**
   * Sends a request item to the queue and returns a promise for the response item.
   * If the item is already in the cache, it will be returned immediately.
   * If there is a pending request for the same item, the promise will be resolved with the same response.
   * Otherwise, the item will be added to the queue and a new request will be sent.
   *
   * @param item - The request item to be sent.
   * @returns A promise that resolves with the response item.
   */
  protected sendQueuedRequest(item: RequestItem): Promise<ResponseItem> {
    const cachedItem = this.getFromCache(item);
    if (cachedItem) {
      return Promise.resolve(cachedItem);
    }

    const hash = this.generateItemHash(item);
    const pendingRequest = this.pendingRequests.get(hash);
    if (pendingRequest) {
      return pendingRequest;
    }

    const responseItem = new Promise<ResponseItem>((resolve) => {
      this.collectionQueue.push({
        requestItem: item,
        responseResolver: resolve,
      });
    });

    this.pendingRequests.set(hash, responseItem);
    this.setupDebounce();
    return responseItem;
  }

  /**
   * Handles the queue of requests by sending them to the server and processing the responses.
   * If a countAfterBottleneck is provided, it will process that many items after the bottleneck.
   *
   * @param countAfterBottleneck - The number of items to process after the bottleneck.
   * If not provided, it will process all items up to the bottleneck.
   *
   * @returns A promise that resolves when all items in the queue have been processed.
   */
  private async handleQueue(countAfterBottleneck?: number): Promise<void> {
    this.clearDebounce();
    this.handlingQueue = true;

    const items = this.collectionQueue.splice(0, Math.min(this.bottleneck, countAfterBottleneck ?? this.bottleneck));
    const remainingItems = countAfterBottleneck ? countAfterBottleneck - items.length : this.collectionQueue.length;

    const requestBody = this.generateRequestBody(items.map((item) => item.requestItem));

    const response = (await lastValueFrom(
      this.httpClient.post(this.ENDPOINT, requestBody, {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": this.i18nService.language,
        },
      })
    )) as ResponseBody;

    const responseItems = this.parseItemsFromResponse(response);

    for (const item of items) {
      const responseItemIndex = responseItems.findIndex((responseItem) => this.matchItems(item.requestItem, responseItem));
      if (responseItemIndex !== -1) {
        const responseItem = responseItems.splice(responseItemIndex, 1)[0];
        item.responseResolver(responseItem);
        this.addToCache(item.requestItem, responseItem);
      }
    }

    if (responseItems.length > 0) {
      console.error("Some response items could not be matched to request items", responseItems);
    }

    if (remainingItems > 0) {
      return this.handleQueue(remainingItems);
    }

    this.handlingQueue = false;
    if (this.collectionQueue.length > 0) {
      this.setupDebounce();
    }
  }

  /**
   * Retrieves a response item from the cache based on the given request item.
   * If the request item is not provided or not found in the cache, it returns null.
   *
   * @param requestItem - The request item to be used as a key to retrieve the response item from the cache.
   *
   * @returns The response item corresponding to the given request item, or null if the request item is not found in the cache.
   */
  protected getFromCache(requestItem: RequestItem): ResponseItem | null {
    if (!requestItem) {
      return null;
    }

    const hash = this.generateItemHash(requestItem);
    const cacheItem = this.cache.get(hash);
    if (!cacheItem) {
      return null;
    }

    return cacheItem.responseItem;
  }

  /**
   * Adds an item to the cache.
   *
   * @param requestItem - The request item to be used as a key to store the response item in the cache.
   * @param responseItem - The response item to be stored in the cache.
   *
   * @returns {void}
   *
   * @remarks
   * This function checks if the request item and response item are valid before adding them to the cache.
   * If the cache size exceeds the maximum cache size, the oldest item in the cache is removed to make space for the new item.
   */
  private addToCache(requestItem: RequestItem, responseItem: ResponseItem): void {
    if (!requestItem) {
      return;
    }

    if (!this.isCachable(responseItem)) {
      return;
    }

    const hash = this.generateItemHash(requestItem);
    this.cache.set(hash, {
      createdAt: new Date(),
      responseItem
    });

    if (this.cache.size > this.cacheSize) {
      const oldestHash = Array.from(this.cache.keys()).reduce((oldest, current) => {
        const currentCache = this.cache.get(current);
        const oldestCache = this.cache.get(oldest);
        if (!currentCache || !oldestCache) {
          return oldest;
        }

        if (currentCache.createdAt < oldestCache.createdAt) {
          return current;
        }
        return oldest;
      });
      this.cache.delete(oldestHash);
    }
  }

  /**
   * Sets up the debounce timeouts for handling the queue of requests.
   * If a request is already being handled, the function returns immediately.
   * If a debounce timeout is already set, it is cleared before setting a new one.
   * A new debounce timeout is set to handle the queue after the debounce time.
   * If a max debounce timeout is not already set, it is set to handle the queue after the max debounce time.
   *
   * @returns {void}
   */
  protected setupDebounce(): void {
    if (this.handlingQueue) {
      return;
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.handleQueue();
    }, this.debounceTime);

    if (!this.maxDebounceTimeout) {
      this.maxDebounceTimeout = setTimeout(() => {
        this.handleQueue();
      }, this.maxDebounceTime);
    }
  }

  /**
   * Clears the debounce timeouts.
   *
   * This function checks if there are any existing debounce timeouts (both max debounce and regular debounce) and clears them.
   * It ensures that any ongoing debounce operations are stopped, preventing any queued requests from being sent.
   *
   * @returns {void}
   */
  private clearDebounce(): void {
    if (this.maxDebounceTimeout) {
      clearTimeout(this.maxDebounceTimeout);
      this.maxDebounceTimeout = null;
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }

  /**
   * Generates the request body from the request items.
   *
   * This method is responsible for transforming an array of request items into a format that can be sent as a request body to the server.
   * The specific transformation logic depends on the requirements of the API endpoint being used.
   *
   * @param items - An array of request items to be included in the request body.
   *
   * @returns The request body, which is a data structure that can be sent to the server.
   *
   * @remarks
   * This method is marked as abstract and must be implemented by subclasses.
   * The implementation should adhere to the specific requirements of the API endpoint being used.
   */
  protected abstract generateRequestBody(items: RequestItem[]): RequestBody;

  /**
   * Parses the response body into response items.
   *
   * This method is responsible for transforming the raw response data received from the server into an array of response items.
   * The specific transformation logic depends on the structure of the response data and the requirements of the application.
   *
   * @param response - The raw response data received from the server.
   * This data should be in the format expected by the API endpoint being used.
   *
   * @returns An array of response items, where each item represents a single data point or entity extracted from the response data.
   *
   * @remarks
   * This method is marked as abstract and must be implemented by subclasses.
   * The implementation should adhere to the specific requirements of the API endpoint being used.
   */
  protected abstract parseItemsFromResponse(response: ResponseBody): ResponseItem[];

  /**
   * Matches the request item to the response item.
   *
   * This method is responsible for comparing a request item with a response item to determine if they represent the same data point or entity.
   * The specific matching logic depends on the requirements of the application and the structure of the request and response data.
   *
   * @param requestItem - The request item to be matched with the response item.
   * This item should be in the format expected by the API endpoint being used.
   *
   * @param responseItem - The response item to be matched with the request item.
   * This item should be in the format expected by the application.
   *
   * @returns A boolean value indicating whether the request item and response item match.
   * If the method returns `true`, it means that the request item and response item represent the same data point or entity.
   * If the method returns `false`, it means that the request item and response item do not represent the same data point or entity.
   *
   * @remarks
   * This method is marked as abstract and must be implemented by subclasses.
   * The implementation should adhere to the specific requirements of the application and the structure of the request and response data.
   */
  protected abstract matchItems(requestItem: RequestItem, responseItem: ResponseItem): boolean;

  /**
   * Generates a hash for the request item.
   *
   * This method is used to create a unique identifier for each request item.
   * The hash is used to store and retrieve the corresponding response item in the cache.
   *
   * @param item - The request item for which a hash needs to be generated.
   * This item should be in the format expected by the API endpoint being used.
   *
   * @returns A string representing the hash of the request item.
   * The hash should be unique for each distinct request item.
   *
   * @remarks
   * This method is marked as abstract and must be implemented by subclasses.
   * The implementation should adhere to the specific requirements of the application and the structure of the request data.
   */
  protected abstract generateItemHash(item: RequestItem): string;

  /**
   * Checks if the response item is cachable.
   *
   * This method is responsible for determining whether a response item should be cached or not.
   * The specific caching logic depends on the requirements of the application and the nature of the response data.
   *
   * @param responseItem - The response item to be checked for cachability.
   * This item should be in the format expected by the application.
   *
   * @returns A boolean value indicating whether the response item is cachable.
   * If the method returns `true`, it means that the response item should be cached.
   * If the method returns `false`, it means that the response item should not be cached.
   *
   * @remarks
   * This method is marked as abstract and must be implemented by subclasses.
   * The implementation should adhere to the specific requirements of the application and the nature of the response data.
   */
  protected abstract isCachable(responseItem: ResponseItem): boolean;
}
