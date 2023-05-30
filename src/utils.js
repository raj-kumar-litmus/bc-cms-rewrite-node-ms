const transformObject = (data, transformations) => {
  const defaultTransformations = {
    upperCase: (value) => value.toUpperCase(),
    lowerCase: (value) => value.toLowerCase()
  };

  const transformedData = { ...data };

  Object.entries(transformations).forEach(([field, transformation]) => {
    if (transformedData[field] && typeof defaultTransformations[transformation] === 'function') {
      transformedData[field] = defaultTransformations[transformation](transformedData[field]);
    }
  });

  return transformedData;
};

module.exports = {
  transformObject
};
