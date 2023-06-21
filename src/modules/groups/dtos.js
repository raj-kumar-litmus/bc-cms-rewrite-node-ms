const Joi = require('joi');

const GroupsEnum = {
  editors: 'editors',
  writers: 'writers',
  all: 'all'
};

const groupsDto = Joi.object({
  type: Joi.string().valid(...Object.values(GroupsEnum))
});

module.exports = {
  groupsDto
};
