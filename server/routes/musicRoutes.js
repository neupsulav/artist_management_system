const router = require("../router");
const musicController = require("../controllers/musicController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.get("/api/music", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager", "artist"])(req, res, () => {
      musicController.getMusic(req, res);
    });
  });
});

router.post("/api/music", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager", "artist"])(req, res, () => {
      musicController.createMusic(req, res);
    });
  });
});

router.put("/api/music", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager", "artist"])(req, res, () => {
      musicController.updateMusic(req, res);
    });
  });
});

router.delete("/api/music", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager", "artist"])(req, res, () => {
      musicController.deleteMusic(req, res);
    });
  });
});
