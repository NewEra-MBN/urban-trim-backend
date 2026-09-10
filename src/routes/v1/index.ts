import { Router } from "express";
import userAuthRoute from './user.auth.routes.js';
import userRoute from './user.routes.js';
import superAdminAuthRoute from './superdmin/superadmin.auth.routes.js';


const router = Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: userAuthRoute
    },
    {
        path: '/user',
        route: userRoute
    },
    {
        path:'/superadmin/auth',
        route: superAdminAuthRoute
    }
]


defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
});


export default router;