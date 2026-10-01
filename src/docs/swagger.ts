import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Urban Trim Api',
            version: '1.0.0'
        },
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}
            },
        }
    },
    apis: ['./src/routes/**/*.ts'],
});


export default swaggerSpec;