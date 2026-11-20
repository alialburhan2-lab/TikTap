export class ForbiddenError extends Error {
  constructor(message = "غير مصرح لك بتنفيذ هذا الإجراء") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "العنصر غير موجود") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>, message = "يرجى تصحيح الحقول المظللة") {
    super(message);
    this.name = "ValidationError";
  }
}
