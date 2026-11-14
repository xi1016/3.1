/* ==========================================================================
   StudyFlow — study task management (tasks.html)
   Login gate · CRUD · validation · delete confirmation · localStorage
   Author: Shuhan Chen · Assignment 3.1
   ========================================================================== */
"use strict";

/* ==================================================================
 * NOTE (Error 1, documented in blog.html): reading localStorage can
 * return null for a first-time visitor. Always fall back to [] and
 * wrap JSON.parse in try...catch before calling .map().
 * ================================================================== */
(function () {
  var STORAGE_KEY = "studyflow.tasks";
  var SESSION_KEY = "studyflow.session";

  /* Demo credentials for the client-side login gate.
     This is a demonstration only — see ethics.html for why client-side
     credential checks are not real security. */
  var USERS = [{ username: "student", password: "StudyPlan2026" }];

  var tasks = [];
  var editingId = null;   // id of the task being edited, or null
  var pendingDeleteId = null; // id awaiting confirmation in the modal

  /* ---------- element shortcuts ---------- */
  function $(id) { return document.getElementById(id); }

  var loginView = $("loginView");
  var appView = $("appView");
  var loginForm = $("loginForm");
  var logoutBtn = $("logoutBtn");
  var taskForm = $("taskForm");
  var formTitle = $("formTitle");
  var submitBtn = $("submitBtn");
  var cancelEditBtn = $("cancelEditBtn");
  var taskBody = $("taskBody");
  var emptyTasks = $("emptyTasks");
  var taskCount = $("taskCount");
  var deleteModal = $("deleteModal");
  var confirmDeleteBtn = $("confirmDeleteBtn");

  /* ==================================================================
   * Persistence — safe load (see Error 1 in blog.html)
   * ================================================================== */
  function loadTasks() {
    var loaded;
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      loaded = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // Corrupted or missing data falls back to an empty list
      loaded = [];
    }
    return loaded;
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  /* ==================================================================
   * Login gate
   * ================================================================== */
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "active";
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
  }

  function showLogin() {
    appView.hidden = true;
    loginView.hidden = false;
    loginForm.reset();
    setFieldError("username", "");
    setFieldError("password", "");
    $("loginError").textContent = "";
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var username = $("username").value.trim();
    var password = $("password").value;
    var ok = true;

    if (username === "") {
      setFieldError("username", "Please enter your username.");
      ok = false;
    } else {
      setFieldError("username", "");
    }

    if (password === "") {
      setFieldError("password", "Please enter your password.");
      ok = false;
    } else {
      setFieldError("password", "");
    }
    if (!ok) return;

    var match = USERS.some(function (u) {
      return u.username === username && u.password === password;
    });

    if (match) {
      sessionStorage.setItem(SESSION_KEY, "active");
      showApp();
      StudyFlow.toast("Signed in. Welcome back!");
    } else {
      $("loginError").textContent = "Invalid username or password. Please try again.";
    }
  });

  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
    StudyFlow.toast("You have been signed out.");
  });

  /* ==================================================================
   * Validation helpers
   * ================================================================== */
  function setFieldError(id, message) {
    var msgEl = $(id + "Error");
    var inputEl = $(id);
    if (msgEl) msgEl.textContent = message;
    if (inputEl) inputEl.classList.toggle("is-invalid", message !== "");
  }

  /* Date check — compares date-to-date at local midnight.
     Fixed version of Error 2 (see blog.html): previously a same-day
     due date was rejected because midnight is always < "now". */
  function isPastDate(dateString) {
    var due = new Date(dateString + "T00:00:00"); // local midnight, explicit
    var today = new Date();
    today.setHours(0, 0, 0, 0);                   // compare date-to-date
    return due < today;                           // only truly past dates
  }

  /* Validate the whole task form. Returns true when every field is ok. */
  function validateTaskForm(data) {
    var ok = true;

    if (data.taskTitle.length < 3 || data.taskTitle.length > 80) {
      setFieldError("taskTitle", "Task title is required (3–80 characters).");
      ok = false;
    } else setFieldError("taskTitle", "");

    if (!/^[A-Za-z]{2,4}\d{3,4}$/.test(data.courseCode.replace(/\s+/g, ""))) {
      setFieldError("courseCode", "Enter a valid course code, e.g. INFO1012.");
      ok = false;
    } else setFieldError("courseCode", "");

    if (data.courseName.length < 3) {
      setFieldError("courseName", "Course name is required (at least 3 characters).");
      ok = false;
    } else setFieldError("courseName", "");

    if (data.dueDate === "") {
      setFieldError("dueDate", "A due date is required.");
      ok = false;
    } else if (isNaN(new Date(data.dueDate).getTime())) {
      setFieldError("dueDate", "That is not a valid date.");
      ok = false;
    } else if (isPastDate(data.dueDate)) {
      setFieldError("dueDate", "Due date cannot be in the past.");
      ok = false;
    } else setFieldError("dueDate", "");

    if (data.description.length < 10) {
      setFieldError("description", "Description is required (at least 10 characters).");
      ok = false;
    } else setFieldError("description", "");

    if (data.notes.length > 500) {
      setFieldError("notes", "Notes must be 500 characters or fewer.");
      ok = false;
    } else setFieldError("notes", "");

    return ok;
  }

  /* ==================================================================
   * Create / update (single shared form)
   * ================================================================== */
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var data = {
      taskTitle: $("taskTitle").value.trim(),
      courseCode: $("courseCode").value.trim(),
      courseName: $("courseName").value.trim(),
      dueDate: $("dueDate").value,
      description: $("description").value.trim(),
      notes: $("notes").value.trim()
    };

    if (!validateTaskForm(data)) {
      StudyFlow.toast("Please fix the highlighted fields.");
      return;
    }

    if (editingId !== null) {
      // ---- UPDATE the selected task ----
      var task = tasks.find(function (t) { return t.id === editingId; });
      if (task) {
        task.title = data.taskTitle;
        task.courseCode = data.courseCode.toUpperCase().replace(/\s+/g, "");
        task.courseName = data.courseName;
        task.dueDate = data.dueDate;
        task.description = data.description;
        task.notes = data.notes;
      }
      StudyFlow.toast("Task updated successfully.");
      exitEditMode();
    } else {
      // ---- CREATE a new task ----
      tasks.push({
        id: Date.now(),
        title: data.taskTitle,
        courseCode: data.courseCode.toUpperCase().replace(/\s+/g, ""),
        courseName: data.courseName,
        dueDate: data.dueDate,
        description: data.description,
        notes: data.notes,
        createdAt: new Date().toISOString()
      });
      StudyFlow.toast("Task added successfully.");
      taskForm.reset();
    }

    saveTasks();
    renderTasks();
  });

  cancelEditBtn.addEventListener("click", function () {
    exitEditMode();
    taskForm.reset();
  });

  function exitEditMode() {
    editingId = null;
    formTitle.textContent = "Add a new study task";
    submitBtn.textContent = "Add task";
    cancelEditBtn.hidden = true;
  }

  /* ==================================================================
   * View (table sorted by due date)
   * ================================================================== */
  function daysUntil(dateString) {
    var due = new Date(dateString + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
  }

  function countdownHTML(dateString) {
    var diff = daysUntil(dateString);
    if (diff < 0) return '<span class="badge badge--overdue">Overdue by ' + Math.abs(diff) + " day" + (Math.abs(diff) === 1 ? "" : "s") + "</span>";
    if (diff === 0) return '<span class="badge badge--today">Due today</span>';
    if (diff <= 3) return '<span class="badge badge--soon">' + diff + " day" + (diff === 1 ? "" : "s") + " left</span>";
    return '<span class="badge badge--later">' + diff + " days left</span>";
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(dateString) {
    var d = new Date(dateString + "T00:00:00");
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  }

  function renderTasks() {
    // Sort by due date (earliest first)
    tasks.sort(function (a, b) { return a.dueDate < b.dueDate ? -1 : 1; });

    taskBody.innerHTML = "";

    if (tasks.length === 0) {
      emptyTasks.hidden = false;
    } else {
      emptyTasks.hidden = true;
    }

    taskCount.textContent = tasks.length + (tasks.length === 1 ? " task" : " tasks");

    tasks.forEach(function (t) {
      var tr = document.createElement("tr");

      var tdTask = document.createElement("td");
      tdTask.innerHTML =
        '<div class="task-cell-title">' + escapeHTML(t.title) + "</div>" +
        '<div class="task-cell-desc">' + escapeHTML(t.description) + "</div>" +
        (t.notes ? '<div class="task-cell-desc"><em>Note: ' + escapeHTML(t.notes) + "</em></div>" : "");

      var tdCourse = document.createElement("td");
      tdCourse.innerHTML =
        '<span class="course-code">' + escapeHTML(t.courseCode) + "</span>" +
        '<span class="course-name">' + escapeHTML(t.courseName) + "</span>";

      var tdDue = document.createElement("td");
      tdDue.className = "due-date";
      tdDue.textContent = formatDate(t.dueDate);

      var tdCountdown = document.createElement("td");
      tdCountdown.innerHTML = countdownHTML(t.dueDate);

      var tdActions = document.createElement("td");
      tdActions.innerHTML =
        '<div class="row-actions">' +
        '<button type="button" class="action-btn" data-action="edit" data-id="' + t.id + '">Edit</button>' +
        '<button type="button" class="action-btn action-btn--danger" data-action="delete" data-id="' + t.id + '">Delete</button>' +
        "</div>";

      tr.append(tdTask, tdCourse, tdDue, tdCountdown, tdActions);
      taskBody.appendChild(tr);
    });
  }

  /* ==================================================================
   * Update & delete actions (event delegation on the table)
   * ================================================================== */
  taskBody.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;

    var id = Number(btn.dataset.id);

    if (btn.dataset.action === "edit") {
      var task = tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      editingId = id;
      $("taskTitle").value = task.title;
      $("courseCode").value = task.courseCode;
      $("courseName").value = task.courseName;
      $("dueDate").value = task.dueDate;
      $("description").value = task.description;
      $("notes").value = task.notes;

      formTitle.textContent = "Edit task";
      submitBtn.textContent = "Save changes";
      cancelEditBtn.hidden = false;
      taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
      $("taskTitle").focus();
    }

    if (btn.dataset.action === "delete") {
      pendingDeleteId = id;
      var victim = tasks.find(function (t) { return t.id === id; });
      $("deleteText").textContent =
        'This will permanently delete "' + (victim ? victim.title : "this task") +
        '". This action cannot be undone.';
      deleteModal.hidden = false;
      confirmDeleteBtn.focus();
    }
  });

  /* ---------- Delete confirmation dialog ---------- */
  function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteId = null;
  }

  confirmDeleteBtn.addEventListener("click", function () {
    tasks = tasks.filter(function (t) { return t.id !== pendingDeleteId; });
    // If we were editing the task that got deleted, reset the form
    if (editingId === pendingDeleteId) {
      exitEditMode();
      taskForm.reset();
    }
    saveTasks();
    renderTasks();
    closeDeleteModal();
    StudyFlow.toast("Task deleted.");
  });

  deleteModal.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeDeleteModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !deleteModal.hidden) closeDeleteModal();
  });

  /* ==================================================================
   * Boot
   * ================================================================== */
  tasks = loadTasks();
  renderTasks();
  if (isLoggedIn()) showApp();
})();
