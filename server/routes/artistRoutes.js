const router = require("../router");
const artistController = require("../controllers/artistController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

router.get("/api/artists", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager", "artist"])(req, res, () => {
      artistController.getArtists(req, res);
    });
  });
});

router.post("/api/artists", (req, res) => {
  authenticate(req, res, () => {
    // authorize(["super_admin", "artist_manager"])(req, res, () => {
    authorize(["artist_manager"])(req, res, () => {
      artistController.createArtist(req, res);
    });
  });
});

router.put("/api/artists", (req, res) => {
  authenticate(req, res, () => {
    // authorize(["super_admin", "artist_manager"])(req, res, () => {
    authorize(["artist_manager"])(req, res, () => {
      artistController.updateArtist(req, res);
    });
  });
});

router.delete("/api/artists", (req, res) => {
  authenticate(req, res, () => {
    // authorize(["super_admin", "artist_manager"])(req, res, () => {
    authorize(["artist_manager"])(req, res, () => {
      artistController.deleteArtist(req, res);
    });
  });
});

router.get("/api/artists/export", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager"])(req, res, () => {
      artistController.exportArtists(req, res);
    });
  });
});

router.post("/api/artists/import", (req, res) => {
  authenticate(req, res, () => {
    authorize(["super_admin", "artist_manager"])(req, res, () => {
      artistController.importArtists(req, res);
    });
  });
});
