const { WorkflowKeysEnum } = require('./enums');

const whereBuilder = (filters) => {
  const where = {};
  Object.entries(filters).forEach(([param, values]) => {
    // Convert id to an array if it is not already an array fails at line[:27]
    if (param === WorkflowKeysEnum.id && !Array.isArray(values)) {
      /* eslint-disable-next-line no-param-reassign */
      values = [values];
    }
    if (param === 'excludeId' || param === 'id') {
      where.id = where.id || {};
      where.id[param === 'excludeId' ? 'notIn' : 'in'] = values;
    } else if (param === 'lastUpdateTs') {
      const date = new Date(values);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      where[param] = {
        gte: startOfDay.toISOString(),
        lt: endOfDay.toISOString()
      };
    } else if (Array.isArray(values)) {
      where[param] = {
        in: values,
        mode: ['status', 'createProcess'].includes(param) ? undefined : 'insensitive'
      };
    } else {
      where[param] = {
        contains: values,
        mode: ['status', 'createProcess'].includes(param) ? undefined : 'insensitive'
      };
    }
  });

  return where;
};

module.exports = { whereBuilder };
