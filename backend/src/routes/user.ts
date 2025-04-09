import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
    console.log(req.body.name, req.body.password);

    res.json({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com'
    });
});

export default router;