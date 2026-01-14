(() => {
  const TZ = "America/Chicago";
  const WEEKS_URL = "weeks.json";

  const grid = document.getElementById("weeksGrid");
  const statusEl = document.getElementById("status");

  function setStatus(msg, type = "info") {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", type === "error");
  }

  // Returns "YYYY-MM-DD" for America/Chicago regardless of the user's local timezone.
  function getChicagoISODate() {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = dtf.formatToParts(new Date());
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }

  function isISODateInRange(isoDate, startISO, endISO) {
    // Works because all are "YYYY-MM-DD"
    return isoDate >= startISO && isoDate <= endISO;
  }

  function formatRange(startISO, endISO) {
    // Minimal display; keep ISO to avoid locale confusion
    if (!startISO || !endISO) return "";
    if (startISO === endISO) return startISO;
    return `${startISO}–${endISO}`;
  }

  function renderWeeks(weeks, todayISO) {
    grid.innerHTML = "";

    let currentFound = false;

    weeks.forEach((w) => {
      const a = document.createElement("a");
      a.className = "week-card";
      a.href = w.href || "#";
      a.setAttribute("role", "button");

      const inRange =
        typeof w.start_date === "string" &&
        typeof w.end_date === "string" &&
        isISODateInRange(todayISO, w.start_date, w.end_date);

      if (inRange) {
        currentFound = true;
        a.classList.add("is-current");
        a.setAttribute("aria-current", "true");
      }

      const top = document.createElement("div");
      top.className = "week-card__top";

      const label = document.createElement("div");
      label.className = "week-card__label";
      label.textContent = w.label ?? "Week";

      top.appendChild(label);

      if (inRange) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "Current week";
        top.appendChild(badge);
      }

      const dates = document.createElement("div");
      dates.className = "week-card__dates";
      dates.textContent = formatRange(w.start_date, w.end_date);

      a.appendChild(top);
      a.appendChild(dates);

      grid.appendChild(a);
    });

    if (!currentFound) {
      setStatus(`No current week match for ${todayISO} (${TZ}).`);
    } else {
      setStatus(`Current week highlighted for ${todayISO} (${TZ}).`);
    }
  }

  async function init() {
    try {
      setStatus("Loading weeks…");

      const todayISO = getChicagoISODate();

      const res = await fetch(WEEKS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${WEEKS_URL} (HTTP ${res.status}).`);

      const data = await res.json();
      const weeks = Array.isArray(data) ? data : data.weeks;

      if (!Array.isArray(weeks) || weeks.length === 0) {
        throw new Error("weeks.json has no weeks array.");
      }

      renderWeeks(weeks, todayISO);
    } catch (err) {
      console.error(err);
      setStatus(
        "Could not load weeks. If you opened this as a file, run a local server (e.g., python -m http.server).",
        "error"
      );
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
