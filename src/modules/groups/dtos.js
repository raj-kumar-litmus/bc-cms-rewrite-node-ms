const Joi = require('joi');

const GroupsEnum = {
  editors: 'editors',
  writers: 'writers'
};

const groupDto = Joi.object({
  type: Joi.string().valid(...Object.values(GroupsEnum))
});

module.exports = {
  groupDto
};
