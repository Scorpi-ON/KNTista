import { registerAs } from "@nestjs/config";
import Joi from "joi";

const schema = Joi.object({
    port: Joi.number(),
});

export default registerAs("web", () => {
    const values = {
        port: Number.parseInt(String(process.env.PORT)),
    };

    const { error } = schema.validate(values, { abortEarly: false });
    if (error) {
        throw new Error(error.message);
    }

    return values;
});
