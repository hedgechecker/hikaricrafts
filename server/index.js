const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // allow 5 messages per IP per day
  message: { error: 'Daily message limit reached. Try again tomorrow.' },
});
const feedBackLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // allow 5 messages per IP per day
  message: { error: 'Daily feedback limit reached. Try again tomorrow.' },
});

app.use(
  cors({
    origin: [
      "https://hikaricrafts.xyz",
      "https://api.hikaricrafts.xyz",
      "https://hikaricrafts.de",
      "https://api.hikaricrafts.de",
      "https://nowakl.org",
      "https://api.nowakl.org",
      "http://localhost:5173",
      "http://192.168.178.42:5173",
      "http://192.168.178.22:5173",
      "*", // for local dev
    ],
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  }),
);

app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = 'your-secret-key'; // move into process.env later
const { authRequired, adminRequired, optionalAuth } = require('./authMiddleware');

app.post('/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmx',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"${name}" <lukas_n3@gmx.de>`,
    to: 'lukas_n3@gmx.de',
    subject,
    text: `Email: ${email}\n${name} schrieb am: ${new Date()}\n${message}`,
  });

  res.json({ ok: true });
});

app.post('/auth/check-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ exists: false, message: 'No email provided' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    return res.json({ exists: true });
  } else {
    return res.json({ exists: false });
  }
});
// --Register--
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ message: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed, name, role: 'USER' },
  });

  res.json({ message: 'User created', user: { id: user.id, email: user.email } });
});
//--Login--
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: 'Invalid login' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Invalid login' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );

  res.json({ token });
});

//protected route
app.get('/auth/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });

  const token = auth.split(' ')[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: data.id } });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.get('/reviews', async (req, res) => {
  const { productId } = req.query;

  // Explicit conversion
  const productIdNumber = productId ? Number(productId) : undefined;

  // Validate
  if (productId && isNaN(productIdNumber)) {
    return res.status(400).json({ error: 'Invalid productId' });
  }

  const reviews = await prisma.review.findMany({
    where: productIdNumber ? { productId: productIdNumber } : undefined,
    orderBy: { id: 'desc' },
  });

  res.json(reviews);
});

// Create a review
app.post('/reviews', authRequired, async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;

    const productIdNumber = Number(productId);
    if (isNaN(productIdNumber)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId: req.user.id,
        productId: productIdNumber,
      },
    });

    res.json(review);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        error: 'You have already reviewed this product',
      });
    }

    console.error(err);
    res.status(500).json({ error: err });
  }
});

app.put('/reviews/:id', authRequired, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  const { rating, comment } = req.body;

  // Load the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  // Prevent editing other users' reviews unless admin
  if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not allowed to edit this review' });
  }

  // Update
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      comment,
    },
  });

  res.json(updated);
});

// Delete a review
app.delete('/reviews/:id', authRequired, async (req, res) => {
  const reviewId = parseInt(req.params.id);

  if (isNaN(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  // Load the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  // Only the review owner or an admin can delete
  if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not allowed to delete this review' });
  }

  // Delete review
  await prisma.review.delete({
    where: { id: reviewId },
  });

  res.json({ message: 'Review deleted' });
});

//Create Feedback
app.post('/feedback', feedBackLimiter, async (req, res) => {
  try {
    const { message, rating } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Feedback cannot be empty' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        message,
        rating: rating ? rating : null,
      },
    });

    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

app.get('/products/:id', async (req, res) => {
  const reviewId = parseInt(req.params.id);

  if (isNaN(reviewId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    const products = await prisma.product.findUnique({
      where: { id: reviewId },
      include: {
        // Include the productOptions linking to global Options
        productOptions: {
          include: {
            option: {
              include: {
                values: true, // all OptionValues for this Option
              },
            },
          },
        },
        // Include all variations
        variations: {
          include: {
            images: true,
            optionValues: {
              include: {
                optionValue: {
                  include: {
                    option: true, // include the global Option info
                  },
                },
              },
            },
          },
        },
        // Keep reviews if needed
        reviews: true,
      },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected error' + err });
  }
});

app.get('/products/full', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        // Include the productOptions linking to global Options
        productOptions: {
          include: {
            option: {
              include: {
                values: true, // all OptionValues for this Option
              },
            },
          },
        },
        // Include all variations
        variations: {
          include: {
            images: true,
            optionValues: {
              include: {
                optionValue: {
                  include: {
                    option: true, // include the global Option info
                  },
                },
              },
            },
          },
        },
        // Keep reviews if needed
        reviews: true,
      },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

app.post('/wireArtProjects', authRequired, async (req, res) => {
  const { name, data, isPublic } = req.body;

  const project = await prisma.wireArtProject.create({
    data: {
      name,
      data,
      isPublic: Boolean(isPublic),
      userId: req.user.id,
    },
  });

  res.json(project);
});

app.get('/wireArtProjects', optionalAuth, async (req, res) => {
  //const whereConditions = [{ isPublic: true }];
  const whereConditions = [];
  
  if (req.user && req.user.id) {
    whereConditions.push({ userId: req.user.id });
  }

  const projects = await prisma.wireArtProject.findMany({
    where: {
      OR: whereConditions,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  res.json(projects);
});

app.get('/wireArtProjects/:id', optionalAuth, async (req, res) => {
  const projectId = Number(req.params.id);

  if (isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project id' });
  }

  const project = await prisma.wireArtProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Access control
  if (!project.isPublic && (!req.user || project.userId !== req.user.id)) {
    return res.status(403).json({ message: 'Access denied' + project.isPublic });
  }

  res.json(project);
});

app.put('/wireArtProjects/:id', authRequired, async (req, res) => {
  const projectId = Number(req.params.id);
  const { name, data, isPublic,version } = req.body;

  const project = await prisma.wireArtProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (project.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const updated = await prisma.wireArtProject.update({
    where: { id: projectId },
    data: {
      name,
      data,
      isPublic,
      version,
    },
  });

  res.json(updated);
});

app.delete('/wireArtProjects/:id', authRequired, async (req, res) => {
  const projectId = Number(req.params.id);

  const project = await prisma.wireArtProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (project.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not allowed' });
  }

  await prisma.wireArtProject.delete({
    where: { id: projectId },
  });

  res.json({ message: 'Project deleted' });
});

app.listen(4000, () => console.log('Server running on 4000'));
