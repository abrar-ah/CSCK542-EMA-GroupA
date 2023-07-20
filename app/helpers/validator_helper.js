const Ajv = require('ajv')
const addFormats = require('ajv-formats');

// ajv is a validator for JSON schema
const ajv = new Ajv({ allowUnionTypes: true, useDefaults: true, allErrors: true });
addFormats(ajv)
require('ajv-errors')(ajv, { singleError: true })


const emailSchema = {
  $async: true,
  type: 'string',
  format: 'email',
  minLength: 6,
  maxLength: 128,
}
const passwordSchema = {
  $async: true,
  type: 'string',
  format: 'password',
  minLength: 8,
  maxLength: 128
}

const loginSchema = {
  $async: true,
  type: 'object',
  properties: {
    email: emailSchema,
    password: passwordSchema
  },
  required: ['email', 'password'],
  additionalProperties: false
}

const nameStringSchema = {
  $async: true,
  type: 'string',
  minLength: 4, // We want the name field to be not too short
  maxLength: 64 // We want the name field to be not too long
}

const enabledBooleanSchema = {
  $async: true,
  type: 'boolean',
  errorMessage: 'Invalid enabled parameter'
}

const createCourseSchema = {
  $async: true,
  type: 'object',
  properties: {
    name: nameStringSchema,
    enabled: enabledBooleanSchema
  },
  required: ['name'],
  additionalProperties: false
}

const tableIDNumberSchema = {
  $async: true,
  type: 'integer',
  minimum: 1,
}

const courseAssignAndUnassignSchema = {
  $async: true,
  type: 'object',
  properties: {
    user_id: {
      ...tableIDNumberSchema,
      errorMessage: 'Invalid user id provided'
    },
    // course_id: {
    //   ...tableIDNumberSchema,
    //   errorMessage: 'Invalid course id provided'
    // },
  },
  // required: ['user_id', 'course_id'],
  required: ['user_id'],
  additionalProperties: false,
}

const setMarksSchema = {
  $async: true,
  type: 'object',
  properties: {
    marks: {
      $async: true,
      type: 'number',
      minimum: 0,
      maximum: 100,
    },
  },
  required: ['marks'],
  additionalProperties: false,
}

const validateLogin = ajv.compile(loginSchema)
const validateCreateCourse = ajv.compile(createCourseSchema)
const validateCourseAssignAndUnassign = ajv.compile(courseAssignAndUnassignSchema)
const validateSetMarks = ajv.compile(setMarksSchema)

module.exports = {
  validateLogin,
  validateCreateCourse,
  validateCourseAssignAndUnassign,
  validateSetMarks
}
