const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "your-secret-key"; // move into process.env later
const { authRequired, adminRequired } = require("./authMiddleware");

// Example protected route (logged in users only)
app.get("/dashboard", authRequired, (req, res) => {
  res.json({ message: "You are logged in", user: req.user });
});

// Example admin-only route
app.get("/admin/stats", adminRequired, (req, res) => {
  res.json({ message: "Admin stats", user: req.user });
});
app.post("/auth/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ exists: false, message: "No email provided" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    return res.json({ exists: true });
  } else {
    return res.json({ exists: false });
  }
});
// --Register--
app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed, name, role:"USER" },
  });

  res.json({ message: "User created", user: { id: user.id, email: user.email } });
});
//--Login--
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: "Invalid login" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid login" });

  const token = jwt.sign({ id: user.id, email: user.email,name: user.name, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token });
});

//protected route
app.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  const token = auth.split(" ")[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: data.id } });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});


app.get("/reviews", async (req, res) => {
  const { productId } = req.query;

  // Explicit conversion
  const productIdNumber = productId ? Number(productId) : undefined;

  // Validate
  if (productId && isNaN(productIdNumber)) {
    return res.status(400).json({ error: "Invalid productId" });
  }

  const reviews = await prisma.review.findMany({
    where: productIdNumber ? { productId: productIdNumber } : undefined,
    orderBy: { id: "desc" },
  });

  res.json(reviews);
});

// Create a review
app.post("/reviews", authRequired, async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;

    const productIdNumber = Number(productId);
    if (isNaN(productIdNumber)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId: req.user.id,     // <-- FIXED
        productId: productIdNumber
      },
    });

    res.json(review);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "You have already reviewed this product"
      });
    }

    console.error(err);
    res.status(500).json({ error: "Unexpected error" });
  }
});



app.put("/reviews/:id", authRequired, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  const { rating, comment } = req.body;

  // Load the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Prevent editing other users' reviews unless admin
  if (review.userId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Not allowed to edit this review" });
  }

  // Update
  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      comment,
    }
  });

  res.json(updated);
});

// Delete a review
app.delete("/reviews/:id", authRequired, async (req, res) => {
  const reviewId = parseInt(req.params.id);

  if (isNaN(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  // Load the review
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  // Only the review owner or an admin can delete
  if (review.userId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Not allowed to delete this review" });
  }

  // Delete review
  await prisma.review.delete({
    where: { id: reviewId }
  });

  res.json({ message: "Review deleted" });
});

//Create Feedback
app.post("/feedback", async (req, res) => {
  try {
    const { message, rating } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Feedback cannot be empty" });
    }

    const feedback = await prisma.feedback.create({
      data: {
        message,
        rating: rating ? rating : null,
      }
    });

    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error" });
  }
});



app.listen(4000, () =>
  console.log("Server running on http://localhost:4000")
);
