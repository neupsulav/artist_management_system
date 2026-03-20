const router = require("../router");
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const superAdminOnly = [authenticate, authorize(["super_admin"])];

router.get("/api/users", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin"])(req, res, () => {
      userController.getUsers(req, res);
    });
  });
});

router.post("/api/users", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin"])(req, res, () => {
      userController.createUser(req, res);
    });
  });
});

router.put("/api/users", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin"])(req, res, () => {
      userController.updateUser(req, res);
    });
  });
});

router.delete("/api/users", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin"])(req, res, () => {
      userController.deleteUser(req, res);
    });
  });
});
