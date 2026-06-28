import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isUUID } from 'class-validator';

export function IsValidUUID(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidUUID',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && isUUID(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid UUID`;
        },
      },
    });
  };
}

export function IsEnumValue(enumType: object, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isEnumValue',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [enumType],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [type] = args.constraints;
          return Object.values(type).includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          const [type] = args.constraints;
          return `${args.property} must be one of: ${Object.values(type).join(', ')}`;
        },
      },
    });
  };
}

export function IsFileArray(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isFileArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return Array.isArray(value) && value.every((f) => f && f.buffer && f.originalname);
        },
        defaultMessage() {
          return 'Must be an array of files';
        },
      },
    });
  };
}
