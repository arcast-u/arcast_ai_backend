export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DiscountCodeError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'DiscountCodeError';
    this.isDiscountError = true;
  }
} 