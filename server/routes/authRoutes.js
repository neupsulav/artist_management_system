const router = require("../router");
const authController = require("../controllers/authController");

router.post("/api/register", authController.register);
router.post("/api/login", authController.login);
