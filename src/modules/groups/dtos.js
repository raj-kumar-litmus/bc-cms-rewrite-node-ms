const Joi = require('joi');

const GroupsEnum = {
  editors: 'editors',
  writers: 'writers'
};

const groupsDto = Joi.object({
  type: Joi.string().valid(...Object.values(GroupsEnum))
});

module.exports = {
  groupsDto
};
