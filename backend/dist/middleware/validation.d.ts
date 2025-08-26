import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const schemas: {
    walletAuth: Joi.ObjectSchema<any>;
    createProject: Joi.ObjectSchema<any>;
    createNode: Joi.ObjectSchema<any>;
    updateNode: Joi.ObjectSchema<any>;
    roiCalculation: Joi.ObjectSchema<any>;
    pagination: Joi.ObjectSchema<any>;
    nodePerformance: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validation.d.ts.map