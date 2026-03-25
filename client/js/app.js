let currentUser = JSON.parse(localStorage.getItem("user"));
let currentTab = "users";
let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) {
    document.getElementById("welcome-text").innerText =
      `Welcome, ${currentUser.first_name} (${currentUser.role})`;
    setupTabs();
    switchTab("users");
  }
});

function setupTabs() {
  const tabsContainer = document.getElementById("main-tabs");
  tabsContainer.innerHTML = "";

  // if (currentUser.role === "super_admin") {
  if (currentUser.role !== "artist") {
    tabsContainer.innerHTML += `<div class="tab active" onclick="switchTab('users')" id="tab-users">Users</div>`;
  }

  if (["super_admin", "artist_manager"].includes(currentUser.role)) {
    tabsContainer.innerHTML += `<div class="tab" onclick="switchTab('artists')" id="tab-artists">Artists</div>`;
  }

  if (currentUser.role === "artist") {
    tabsContainer.innerHTML += `<div class="tab active" onclick="switchTab('music')" id="tab-music">My Music</div>`;
    switchTab("music");
  }
}

function switchTab(tab) {
  currentTab = tab;
  currentPage = 1;
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) tabEl.classList.add("active");

  loadData();
}

async function loadData() {
  const contentArea = document.getElementById("content-area");
  contentArea.innerHTML = "<p>Loading...</p>";

  try {
    if (currentTab === "users") {
      await renderUsers();
    } else if (currentTab === "artists") {
      await renderArtists();
    } else if (currentTab === "music") {
      // Logic for 'artist' role to view their own music
      if (currentUser.role === "artist") {
        try {
          // Fetch artists to find the one matching the current user
          const res = await api.get("/artists", { limit: 1000 });
          const artistName = `${currentUser.first_name} ${currentUser.last_name}`;
          const artist = res.data.find(
            (a) => a.name.toLowerCase() === artistName.toLowerCase(),
          );

          if (artist) {
            await viewSongs(artist.id, artist.name);
          } else {
            contentArea.innerHTML = `<div style="text-align: center; margin-top: 2rem;"><h3>Artist Profile Not Found</h3><p>Could not find an artist profile with name "${artistName}".</p></div>`;
          }
        } catch (err) {
          contentArea.innerHTML = `<p class="text-danger">Error loading music: ${err.message}</p>`;
        }
      } else {
        contentArea.innerHTML = "<h3>Select an artist to view music</h3>";
      }
    }
  } catch (err) {
    contentArea.innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
  }
}

// User CRUD Rendering
async function renderUsers() {
  const res = await api.get("/users", { page: currentPage });
  const { data, pagination } = res;

  let html = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Users Management</h2>
            <button class="btn" style="width: auto;" onclick="showUserModal()">Add User</button>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (user) => `
                        <tr>
                            <td>${user.first_name} ${user.last_name}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>
                                <button onclick="editUser(${user.id})" class="btn btn-outline" style="width: auto; padding: 0.25rem 0.5rem;">Edit</button>
                                <button onclick="deleteUser(${user.id})" class="btn btn-danger" style="width: auto; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">Delete</button>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        ${renderPagination(pagination)}
    `;
  document.getElementById("content-area").innerHTML = html;
}

// Artist CRUD Rendering
async function renderArtists() {
  const res = await api.get("/artists", { page: currentPage });
  const { data, pagination } = res;

  let html = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Artists Management</h2>
            <div style="display: flex; gap: 0.5rem;">
                ${
                  // ["super_admin", "artist_manager"].includes(currentUser.role)
                  ["artist_manager"].includes(currentUser.role)
                    ? `
                    <button class="btn btn-outline" style="width: auto;" onclick="exportArtists()">Export CSV</button>
                    ${currentUser.role === "artist_manager" ? `<button class="btn btn-outline" style="width: auto;" onclick="triggerImport()">Import CSV</button>` : ""}
                    <button class="btn" style="width: auto;" onclick="showArtistModal()">Add Artist</button>
                `
                    : ""
                }
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Release Year</th>
                        <th>Albums</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data
                      .map(
                        (artist) => `
                        <tr>
                            <td>${artist.name}</td>
                            <td>${artist.first_release_year}</td>
                            <td>${artist.no_of_albums_released}</td>
                            <td>
                                <button onclick="viewSongs(${artist.id}, '${artist.name}')" class="btn btn-outline" style="width: auto; padding: 0.25rem 0.5rem;">View Songs</button>
                                ${
                                  // ["super_admin", "artist_manager"].includes(
                                  //   currentUser.role,
                                  // )
                                  ["artist_manager"].includes(currentUser.role)
                                    ? `
                                    <button onclick="editArtist(${artist.id})" class="btn btn-outline" style="width: auto; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">Edit</button>
                                    <button onclick="deleteArtist(${artist.id})" class="btn btn-danger" style="width: auto; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">Delete</button>
                                `
                                    : ""
                                }
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        ${renderPagination(pagination)}
        <input type="file" id="csv-import" style="display: none;" onchange="importArtists(this)">
    `;
  document.getElementById("content-area").innerHTML = html;
}

// Music CRUD Rendering
async function viewSongs(artistId, artistName) {
  const songs = await api.get("/music", { artist_id: artistId });

  let html = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <h2>Songs: ${artistName}</h2>
            ${
              ["super_admin", "artist_manager", "artist"].includes(
                currentUser.role,
              )
                ? `
                <button class="btn" style="width: auto;" onclick="showMusicModal(${artistId}, null, '${artistName.replace(/'/g, "\\'")}')">Add Song</button> 
            `
                : ""
            }
            ${currentUser.role !== "artist" ? `<button class="btn btn-outline" style="width: auto;" onclick="switchTab('artists')">Back to Artists</button>` : ""}
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Album</th>
                        <th>Genre</th>
                        ${
                          ["super_admin", "artist_manager", "artist"].includes(
                            currentUser.role,
                          )
                            ? "<th>Actions</th>"
                            : ""
                        }
                    </tr>
                </thead>
                <tbody>
                    ${songs
                      .map(
                        (song) => `
                        <tr>
                            <td>${song.title}</td>
                            <td>${song.album_name}</td>
                            <td>${song.genre}</td>
                            ${
                              [
                                "super_admin",
                                "artist_manager",
                                "artist",
                              ].includes(currentUser.role)
                                ? `
                                <td>
                                    <button onclick="editMusic(${song.id}, ${artistId}, '${artistName.replace(/'/g, "\\'")}')" class="btn btn-outline" style="width: auto; padding: 0.25rem 0.5rem;">Edit</button>
                                    <button onclick="deleteMusic(${song.id})" class="btn btn-danger" style="width: auto; padding: 0.25rem 0.5rem; margin-left: 0.5rem;">Delete</button>
                                </td>
                            `
                                : ""
                            }
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;
  document.getElementById("content-area").innerHTML = html;
}

// Utility Functions
function renderPagination(pagination) {
  if (!pagination || pagination.pages <= 1) return "";
  return `
        <div class="pagination">
            ${Array.from(
              { length: pagination.pages },
              (_, i) => `
                <button class="page-btn ${pagination.page === i + 1 ? "active" : ""}" onclick="goToPage(${i + 1})">${i + 1}</button>
            `,
            ).join("")}
        </div>
    `;
}

function goToPage(p) {
  currentPage = p;
  loadData();
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Modal Management
function showModal(content) {
  const modal = document.getElementById("modal-container");
  const body = document.getElementById("modal-body");
  body.innerHTML = content;
  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("modal-container").style.display = "none";
}

window.onclick = (event) => {
  if (event.target == document.getElementById("modal-container")) closeModal();
};

// USER CRUD
function showUserModal(user = null) {
  const isEdit = !!user;
  const title = isEdit ? "Edit User" : "Add New User";

  const content = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>${title}</h3>
            <span onclick="closeModal()" style="cursor:pointer; font-size: 1.5rem;">&times;</span>
        </div>
        <form id="user-form">
            <input type="hidden" id="userId" value="${user?.id || ""}">
            <div class="form-group">
                <label>First Name</label>
                <input type="text" id="m_first_name" class="form-control" value="${user?.first_name || ""}" required>
            </div>
            <div class="form-group">
                <label>Last Name</label>
                <input type="text" id="m_last_name" class="form-control" value="${user?.last_name || ""}" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="m_email" class="form-control" value="${user?.email || ""}" ${isEdit ? "disabled" : "required"}>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="m_phone" class="form-control" value="${user?.phone || ""}">
            </div>
            <div class="form-group">
                <label>DOB</label>
                <input type="date" id="m_dob" class="form-control" value="${user?.dob ? user.dob.split("T")[0] : ""}">
            </div>
            <div class="form-group">
                <label>Gender</label>
                <select id="m_gender" class="form-control">
                    <option value="m" ${user?.gender === "m" ? "selected" : ""}>Male</option>
                    <option value="f" ${user?.gender === "f" ? "selected" : ""}>Female</option>
                    <option value="o" ${user?.gender === "o" ? "selected" : ""}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" id="m_address" class="form-control" value="${user?.address || ""}">
            </div>
            ${
              !isEdit
                ? `
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="m_password" class="form-control" required>
                </div>
            `
                : ""
            }
            <div class="form-group">
                <label>Role</label>
                <select id="m_role" class="form-control">
                    <option value="super_admin" ${user?.role === "super_admin" ? "selected" : ""}>Super Admin</option>
                    <option value="artist_manager" ${user?.role === "artist_manager" ? "selected" : ""}>Artist Manager</option>
                    <option value="artist" ${user?.role === "artist" ? "selected" : ""}>Artist</option>
                </select>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button type="submit" class="btn">${isEdit ? "Update" : "Create"}</button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
  showModal(content);

  document.getElementById("user-form").onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      first_name: document.getElementById("m_first_name").value,
      last_name: document.getElementById("m_last_name").value,
      role: document.getElementById("m_role").value,
      phone: document.getElementById("m_phone").value,
      dob: document.getElementById("m_dob").value,
      gender: document.getElementById("m_gender").value,
      address: document.getElementById("m_address").value,
    };

    // Client-side validations
    if (!data.first_name || !data.last_name || !data.role) {
      alert("First name, last name, and role are required");
      return;
    }

    if (!isEdit) {
      data.email = document.getElementById("m_email").value;
      data.password = document.getElementById("m_password").value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email)) {
        alert("A valid email is required");
        return;
      }
      if (!data.password || data.password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }

      await api.post("/users", data);
    } else {
      const id = document.getElementById("userId").value;
      await api.put("/users", data, { id });
    }
    closeModal();
    loadData();
  };
}

async function editUser(id) {
  try {
    const res = await api.get("/users", { page: 1, limit: 100 }); // Simple find
    const user = res.data.find((u) => u.id === id);
    showUserModal(user);
  } catch (err) {
    alert(err.message);
  }
}

async function deleteUser(id) {
  if (confirm("Are you sure you want to delete this user?")) {
    await api.delete("/users", { id });
    loadData();
  }
}

// ARTIST CRUD
function showArtistModal(artist = null) {
  const isEdit = !!artist;
  const content = `
        <h3>${isEdit ? "Edit Artist" : "Add Artist"}</h3>
        <form id="artist-form">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="a_name" class="form-control" value="${artist?.name || ""}" required>
            </div>
            <div class="form-group">
                <label>DOB</label>
                <input type="date" id="a_dob" class="form-control" value="${artist?.dob ? artist.dob.split("T")[0] : ""}">
            </div>
            <div class="form-group">
                <label>Address</label>
                <input type="text" id="a_address" class="form-control" value="${artist?.address || ""}">
            </div>
            <div class="form-group">
                <label>First Release Year</label>
                <input type="number" id="a_year" class="form-control" value="${artist?.first_release_year || ""}">
            </div>
            <div class="form-group">
                <label>No. of Albums</label>
                <input type="number" id="a_albums" class="form-control" value="${artist?.no_of_albums_released || ""}">
            </div>
            <div class="form-group">
                <label>Gender</label>
                <select id="a_gender" class="form-control">
                    <option value="m" ${artist?.gender === "m" ? "selected" : ""}>Male</option>
                    <option value="f" ${artist?.gender === "f" ? "selected" : ""}>Female</option>
                    <option value="o" ${artist?.gender === "o" ? "selected" : ""}>Other</option>
                </select>
            </div>
            <button type="submit" class="btn">${isEdit ? "Update" : "Create"}</button>
        </form>
    `;
  showModal(content);

  document.getElementById("artist-form").onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("a_name").value,
      dob: document.getElementById("a_dob").value,
      address: document.getElementById("a_address").value,
      first_release_year: document.getElementById("a_year").value,
      no_of_albums_released: document.getElementById("a_albums").value,
      gender: document.getElementById("a_gender").value,
    };

    // Client-side validations
    if (!data.name) {
      alert("Name is required");
      return;
    }

    if (
      data.first_release_year &&
      (data.first_release_year < 1900 ||
        data.first_release_year > new Date().getFullYear())
    ) {
      alert("Invalid first release year");
      return;
    }

    if (data.no_of_albums_released && data.no_of_albums_released < 0) {
      alert("Number of albums cannot be negative");
      return;
    }

    if (isEdit) await api.put("/artists", data, { id: artist.id });
    else await api.post("/artists", data);
    closeModal();
    loadData();
  };
}

async function editArtist(id) {
  const res = await api.get("/artists", { page: 1, limit: 100 });
  const artist = res.data.find((a) => a.id === id);
  showArtistModal(artist);
}

async function deleteArtist(id) {
  if (confirm("Delete artist and their songs?")) {
    await api.delete("/artists", { id });
    loadData();
  }
}

// MUSIC CRUD
function showMusicModal(artistId, music = null, artistName = "") {
  const isEdit = !!music;
  const title = isEdit
    ? `Edit Song for ${artistName || "Artist"}`
    : `Add Song for ${artistName || "Artist"}`;
  const content = `
        <h3>${title}</h3>
        <form id="music-form">
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="m_title" class="form-control" value="${music?.title || ""}" required>
            </div>
            <div class="form-group">
                <label>Album</label>
                <input type="text" id="m_album" class="form-control" value="${music?.album_name || ""}">
            </div>
            <div class="form-group">
                <label>Genre</label>
                <select id="m_genre" class="form-control">
                    <option value="rnb" ${music?.genre === "rnb" ? "selected" : ""}>R&B</option>
                    <option value="country" ${music?.genre === "country" ? "selected" : ""}>Country</option>
                    <option value="classic" ${music?.genre === "classic" ? "selected" : ""}>Classic</option>
                    <option value="rock" ${music?.genre === "rock" ? "selected" : ""}>Rock</option>
                    <option value="jazz" ${music?.genre === "jazz" ? "selected" : ""}>Jazz</option>
                </select>
            </div>
            <button type="submit" class="btn">${isEdit ? "Update" : "Create"}</button>
        </form>
    `;
  showModal(content);

  document.getElementById("music-form").onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      artist_id: artistId,
      title: document.getElementById("m_title").value,
      album_name: document.getElementById("m_album").value,
      genre: document.getElementById("m_genre").value,
    };

    // Client-side validations
    if (!data.title || !data.genre) {
      alert("Title and Genre are required");
      return;
    }

    if (isEdit) await api.put("/music", data, { id: music.id });
    else await api.post("/music", data);
    closeModal();

    // Refresh the song list for the current artist
    if (currentUser.role === "artist") {
      loadData();
    } else {
      const artistName = document
        .querySelector("h2")
        .innerText.replace("Songs: ", "");
      viewSongs(artistId, artistName);
    }
  };
}

async function editMusic(id, artistId, artistName) {
  try {
    const songs = await api.get("/music", { artist_id: artistId });
    const music = songs.find((s) => s.id === id);
    if (music) {
      showMusicModal(artistId, music, artistName);
    }
  } catch (err) {
    alert(err.message);
  }
}

async function deleteMusic(id) {
  if (confirm("Delete song?")) {
    await api.delete("/music", { id });
    loadData();
  }
}

// CSV Handlers
async function exportArtists() {
  try {
    const response = await fetch("http://localhost:3000/api/artists/export", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "artists.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(err.message);
  }
}

function triggerImport() {
  document.getElementById("csv-import").click();
}

async function importArtists(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await api.importCSV("/artists/import", e.target.result);
      alert("Artists imported successfully");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };
  reader.readAsText(file);
}

// Global exposure for event handlers
window.closeModal = closeModal;
window.showUserModal = showUserModal;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showArtistModal = showArtistModal;
window.editArtist = editArtist;
window.deleteArtist = deleteArtist;
window.exportArtists = exportArtists;
window.triggerImport = triggerImport;
window.importArtists = importArtists;
window.showMusicModal = showMusicModal;
window.editMusic = editMusic;
window.deleteMusic = deleteMusic;
