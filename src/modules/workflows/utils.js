const { WorkflowKeysEnum } = require('./enums');

const whereBuilder = (filters) => {
  const where = {};

  Object.entries(filters).forEach(([param, values]) => {
    let updatedValues = values;

    if (Array.isArray(updatedValues)) {
      updatedValues = updatedValues.filter((value) => value !== '');
    }

    if (param === 'globalSearch') {
      const globalSearch = updatedValues;

      const searchFields = ['styleId', 'brand', 'title'];
      if (Array.isArray(globalSearch)) {
        where.OR = {
          OR: searchFields.map((field) => ({
            [field]: { in: globalSearch, mode: 'insensitive' }
          }))
        };
      } else if (typeof globalSearch === 'string') {
        where.OR = searchFields.map((field) => ({
          [field]: { contains: globalSearch, mode: 'insensitive' }
        }));
      }

      return;
    }

    if (param === WorkflowKeysEnum.id && !Array.isArray(updatedValues)) {
      updatedValues = [updatedValues];
    }

    if (param === 'excludeId' || param === 'id') {
      where.id = where.id || {};
      where.id[param === 'excludeId' ? 'notIn' : 'in'] = updatedValues;
    } else if (param === 'lastUpdateTs') {
      const date = new Date(updatedValues);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      where[param] = {
        gte: startOfDay.toISOString(),
        lt: endOfDay.toISOString()
      };
    } else if (Array.isArray(updatedValues)) {
      where[param] = {
        in: updatedValues,
        mode: ['status', 'createProcess'].includes(param) ? undefined : 'insensitive'
      };
    } else {
      where[param] = {
        contains: updatedValues,
        mode: ['status', 'createProcess'].includes(param) ? undefined : 'insensitive'
      };
    }
  });

  return where;
};

const deepCompare = (obj1, obj2, ignoreFields = []) => {
  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    throw new Error('Both objects must be valid non-null objects');
  }

  const changes = {};

  const compare = (innerObj1, innerObj2, path = '') => {
    for (const key in innerObj2) {
      if (Object.prototype.hasOwnProperty.call(innerObj2, key)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (ignoreFields.includes(currentPath)) {
          continue; // Skip ignored fields
        }

        if (innerObj1 && Object.prototype.hasOwnProperty.call(innerObj1, key)) {
          const value1 = innerObj1[key];
          const value2 = innerObj2[key];

          if (Array.isArray(value1) && Array.isArray(value2)) {
            const arr1 = value1 ? value1.slice().sort() : [];
            const arr2 = value2 ? value2.slice().sort() : [];

            if (JSON.stringify(arr1) !== JSON.stringify(arr2)) {
              changes[currentPath] = {
                oldValue: arr1,
                newValue: arr2
              };
            }
          } else if (typeof value1 === 'object' && typeof value2 === 'object') {
            compare(value1, value2, currentPath);
          } else if (value1 !== value2) {
            changes[currentPath] = {
              oldValue: value1,
              newValue: value2
            };
          }
        } else {
          changes[currentPath] = {
            oldValue: null,
            newValue: innerObj2[key]
          };
        }
      }
    }

    for (const key in innerObj1) {
      if (
        innerObj1 &&
        Object.prototype.hasOwnProperty.call(innerObj1, key) &&
        !Object.prototype.hasOwnProperty.call(innerObj2, key)
      ) {
        const currentPath = path ? `${path}.${key}` : key;
        if (ignoreFields.includes(currentPath)) {
          continue; // Skip ignored fields
        }
        changes[currentPath] = {
          oldValue: innerObj1[key],
          newValue: null
        };
      }
    }
  };

  compare(obj1, obj2);

  // Exclude changes where both oldValue and newValue are null
  for (const key in changes) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      const { oldValue, newValue } = changes[key];
      if (oldValue === null && newValue === null) {
        delete changes[key];
      }
    }
  }
  const changeLog = {};
  for (const key in changes) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      const [outerKey, innerKey] = key.split('.');

      if (!changeLog[outerKey]) {
        changeLog[outerKey] = {};
      }

      // Handle the case when innerKey is undefined
      const value = changes[key];
      if (innerKey === undefined) {
        changeLog[outerKey] = value;
      } else {
        changeLog[outerKey][innerKey] = value;
      }
    }
  }

  return changeLog;
};

module.exports = { whereBuilder, deepCompare };
