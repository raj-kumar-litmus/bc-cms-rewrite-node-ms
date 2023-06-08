const { WorkflowKeysEnum } = require('./enums');

const whereBuilder = (filters) => {
  const where = {};

  Object.entries(filters).forEach(([param, values]) => {
    if (param === 'globalSearch') {
      const globalSearch = values;

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

    // Convert id to an array if it is not already an array
    let updatedValues = values;
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

module.exports = { whereBuilder };
