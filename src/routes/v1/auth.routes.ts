import { Router } from "express";
const router = Router();
import authControllers from "../../controllers/auth.controllers.js";

router.post('/register', authControllers.register)
router.post('/login', authControllers.login)
router.post('/logout', authControllers.logout )
router.post('/refresh-tokens', (req, res) => res.send('hello i am listening'))
router.post('/forgot-pass', (req, res) => res.send('hello i am listening'))
router.post('/reset-pass', (req, res) => res.send('hello i am listening'))
router.post('/send-verification-email', (req, res) => res.send('hello i am listening'))
router.post('/verify-email', (req, res) => res.send('hello i am listening'))




export default router