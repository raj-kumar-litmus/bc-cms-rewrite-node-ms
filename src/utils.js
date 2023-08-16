/* eslint-disable no-return-assign,no-bitwise,no-param-reassign,consistent-return */

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

/* eslint-disable-next-line */
const groupBy = (x, f) => x.reduce((a, b, i) => ((a[f(b, i, x)] ||= []).push(b), a), {});

const deDuplicate = (arr, field) =>
  arr.filter((obj, index) => arr.findIndex((item) => item[field] === obj[field]) === index);

const chunkArray = (array, chunkSize) => {
  if (!array || !Array.isArray(array) || !chunkSize || array.length < 1) return;
  return array.reduce(
    (arr, item, idx) => (arr[(idx / chunkSize) | 0] ??= []).push(item) && arr,
    []
  );
};

const constants = {
  CHUNK_SIZE_STYLE_SEARCH: 25
};

module.exports = {
  chunkArray,
  constants,
  transformObject,
  deDuplicate,
  groupBy
};
