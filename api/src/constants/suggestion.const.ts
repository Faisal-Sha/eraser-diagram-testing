import { DIAMETER_NOMINAL_LABELS } from '@common/constants/diameter-nominal.const';
import { CUSTOM_RULE_S } from '@common/constants/thk-suggestion.const'

export const CUSTOM_RULE_DN: {
  label: string;
  value: number;
  sRange: {
    pipeFittings: string[];
    N: {
      min: number;
      max: number;
    };
    S: {
      min: number;
      max: number;
    };
  }[]
}[] = [{
  label: '15',
  value: 21.3,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.0,
      max: 5.0
    },
    S: {
      min: 1.0,
      max: 4.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.4,
      max: 4.5
    },
    S: {
      min: 1.0,
      max: 4.0
    }
  }]
}, 
{
  label: '20',
  value: 26.9,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.0,
      max: 8.0
    },
    S: {
      min: 1.0,
      max: 4.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.4,
      max: 5.0
    },
    S: {
      min: 1.0,
      max: 4.0
    }
  }]
}, 
{
  label: '25',
  value: 33.7,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.3,
      max: 8.8
    },
    S: {
      min: 1.0,
      max: 4.5
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.4,
      max: 8.0
    },
    S: {
      min: 1.0,
      max: 4.5
    }
  }]
},
{
  label: '32',
  value: 42.4,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.6,
      max: 10.0
    },
    S: {
      min: 1.6,
      max: 5.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.4,
      max: 8.8
    },
    S: {
      min: 1.6,
      max: 5.0
    }
  }]
},
{
  label: '40',
  value: 48.3,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.6,
      max: 12.5
    },
    S: {
      min: 1.6,
      max: 5.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.4,
      max: 8.8
    },
    S: {
      min: 1.6,
      max: 5.0
    }
  }]
},
{
  label: '50',
  value: 60.3,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.9,
      max: 16.0
    },
    S: {
      min: 1.6,
      max: 5.6
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.4,
      max: 10.0
    },
    S: {
      min: 1.6,
      max: 5.6
    }
  }]
},
{
  label: '65',
  value: 76.1,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 2.9,
      max: 20.0
    },
    S: {
      min: 1.6,
      max: 7.1
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.6,
      max: 10.0
    },
    S: {
      min: 1.6,
      max: 7.1
    }
  }]
},
{
  label: '80',
  value: 88.9,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 3.2,
      max: 25.0
    },
    S: {
      min: 1.6,
      max: 8.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 1.6,
      max: 10.0
    },
    S: {
      min: 1.6,
      max: 8.0
    }
  }]
},
{
  label: '100',
  value: 114.3,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 3.6,
      max: 32.0
    },
    S: {
      min: 1.6,
      max: 8.8
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 2.0,
      max: 11.0
    },
    S: {
      min: 1.6,
      max: 8.8
    }
  }]
},
{
  label: '125',
  value: 139.7,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 4.0,
      max: 40.0
    },
    S: {
      min: 1.6,
      max: 10.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 2.0,
      max: 11.0
    },
    S: {
      min: 1.6,
      max: 10.0
    }
  }]
},
{
  label: '150',
  value: 168.3,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 4.5,
      max: 50.0
    },
    S: {
      min: 1.6,
      max: 11.0
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 2.9,
      max: 11.0
    },
    S: {
      min: 1.6,
      max: 11.0
    }
  }]
},
{
  label: '200',
  value: 219.1,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 6.3,
      max: 70.0
    },
    S: {
      min: 2.0,
      max: 12.5
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.2,
      max: 12.5
    },
    S: {
      min: 2.0,
      max: 12.5
    }
  }]
},
{
  label: '250',
  value: 273.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 6.3,
      max: 80.0
    },
    S: {
      min: 2.0,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.2,
      max: 12.5
    },
    S: {
      min: 2.0,
      max: 14.2
    }
  }]
},
{
  label: '300',
  value: 323.9,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 7.1,
      max: 100.0
    },
    S: {
      min: 2.6,
      max: 12.5
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.2,
      max: 12.5
    },
    S: {
      min: 2.6,
      max: 12.5
    }
  }]
},
{
  label: '350',
  value: 355.6,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 8.0,
      max: 100.0
    },
    S: {
      min: 2.6,
      max: 12.5
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.2,
      max: 12.5
    },
    S: {
      min: 2.6,
      max: 12.5
    }
  }]
},
{
  label: '400',
  value: 406.4,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 8.8,
      max: 100.0
    },
    S: {
      min: 2.6,
      max: 12.5
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.6,
      max: 12.5
    },
    S: {
      min: 2.6,
      max: 12.5
    }
  }]
},
{
  label: '450',
  value: 457.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 10.0,
      max: 100.0
    },
    S: {
      min: 3.2,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.6,
      max: 12.5
    },
    S: {
      min: 3.2,
      max: 14.2
    }
  }]
},
{
  label: '500',
  value: 508.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 11.0,
      max: 100.0
    },
    S: {
      min: 3.2,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 3.6,
      max: 16.0
    },
    S: {
      min: 3.2,
      max: 14.2
    }
  }]
},
{
  label: '600',
  value: 610.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 12.5,
      max: 100.0
    },
    S: {
      min: 3.2,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 4.5,
      max: 28.0
    },
    S: {
      min: 3.2,
      max: 14.2
    }
  }]
},
{
  label: '700',
  value: 711.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 25.0,
      max: 100.0
    },
    S: {
      min: 7.1,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 4.5,
      max: 32.0
    },
    S: {
      min: 7.1,
      max: 14.2
    }
  }]
},
{
  label: '800',
  value: 813.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 25.0,
      max: 100.0
    },
    S: {
      min: 8.0,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 4.5,
      max: 40.0
    },
    S: {
      min: 8.0,
      max: 14.2
    }
  }]
},
{
  label: '900',
  value: 914.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 25.0,
      max: 100.0
    },
    S: {
      min: 8.8,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 4.5,
      max: 40.0
    },
    S: {
      min: 8.8,
      max: 14.2
    }
  }]
},
{
  label: '1000',
  value: 1016.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 25.0,
      max: 100.0
    },
    S: {
      min: 8.8,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 4.5,
      max: 40.0
    },
    S: {
      min: 8.8,
      max: 14.2
    }
  }]
},
{
  label: '1200',
  value: 1219.0,
  sRange: [{
    pipeFittings: ["1000"], // nahtlos
    N: {
      min: 25.0,
      max: 100.0
    },
    S: {
      min: 8.8,
      max: 14.2
    }
  }, {
    pipeFittings: ["1010"], // geschweißt
    N: {
      min: 5.6,
      max: 40.0
    },
    S: {
      min: 8.8,
      max: 14.2
    }
  }]
}];


const CUSTOM_RULE_MATERIAL = [{
  value: 'P235GH'
}, {
  value: '1.4539'
}];

export const CUSTOM_RULE_SUGGESTIONS = {
  'material': CUSTOM_RULE_MATERIAL,
  'dn1': CUSTOM_RULE_DN.filter((dn) => !!DIAMETER_NOMINAL_LABELS[dn.value]),
  'dn2': CUSTOM_RULE_DN.filter((dn) => !!DIAMETER_NOMINAL_LABELS[dn.value]),
  's1': CUSTOM_RULE_S,
  's2': CUSTOM_RULE_S
};
