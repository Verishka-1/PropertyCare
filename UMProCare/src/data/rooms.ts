/* =====================================================
   TYPES
===================================================== */

export type Building = {
  id: string;
  name: string;
};

export type Room = {
  id: string;
  name: string;
  buildingId: string;
  building: string;
  floor: string;
};

export type ReportStatus =
  | "Pending"
  | "Verified"
  | "For Repair"
  | "Repaired";

export type Report = {
  id: string;
  roomId: string;
  room: string;
  buildingId: string;
  building: string;
  floor: string;
  property: string;
  description: string;
  status: ReportStatus;
  date: string;
};

/* =====================================================
   BUILDINGS
===================================================== */

export const buildings: Building[] = [
  {
    id: "old",
    name: "Old Building",
  },
  {
    id: "new1",
    name: "Building 1",
  },
  {
    id: "new2",
    name: "Building 2",
  },
  {
    id: "cr",
    name: "Building CR",
  },
];

/* =====================================================
   ROOMS
===================================================== */

export const rooms: Room[] = [
  /* ===================================================
     OLD BUILDING
     Retained from the existing room list.
  =================================================== */

  {
    id: "old-302",
    name: "302",
    buildingId: "old",
    building: "Old Building",
    floor: "3rd Floor",
  },
  {
    id: "old-301",
    name: "301",
    buildingId: "old",
    building: "Old Building",
    floor: "3rd Floor",
  },
  {
    id: "old-avr",
    name: "AVR",
    buildingId: "old",
    building: "Old Building",
    floor: "Ground Floor",
  },
  {
    id: "old-comlab-v1",
    name: "COMLAB - V1",
    buildingId: "old",
    building: "Old Building",
    floor: "Ground Floor",
  },
  {
    id: "old-comlab-v3",
    name: "COMLAB - V3",
    buildingId: "old",
    building: "Old Building",
    floor: "Ground Floor",
  },
  {
    id: "old-comlab-v2",
    name: "COMLAB - V2",
    buildingId: "old",
    building: "Old Building",
    floor: "Ground Floor",
  },
  {
    id: "old-engineering-comlab",
    name: "ENGINEERING COMLAB",
    buildingId: "old",
    building: "Old Building",
    floor: "Ground Floor",
  },

  /* ===================================================
     BUILDING 1
     Rooms shown on the updated Building 1 PNG.
  =================================================== */

  // 3rd Floor
  {
    id: "b1-309",
    name: "B1 309",
    buildingId: "new1",
    building: "Building 1",
    floor: "3rd Floor",
  },
  {
    id: "b1-310",
    name: "B1 310",
    buildingId: "new1",
    building: "Building 1",
    floor: "3rd Floor",
  },
  {
    id: "b1-311",
    name: "B1 311",
    buildingId: "new1",
    building: "Building 1",
    floor: "3rd Floor",
  },
  {
    id: "b1-312",
    name: "B1 312",
    buildingId: "new1",
    building: "Building 1",
    floor: "3rd Floor",
  },

  // 2nd Floor
  {
    id: "b1-205",
    name: "B1 205",
    buildingId: "new1",
    building: "Building 1",
    floor: "2nd Floor",
  },
  {
    id: "b1-206",
    name: "B1 206",
    buildingId: "new1",
    building: "Building 1",
    floor: "2nd Floor",
  },
  {
    id: "b1-207",
    name: "B1 207",
    buildingId: "new1",
    building: "Building 1",
    floor: "2nd Floor",
  },
  {
    id: "b1-208",
    name: "B1 208",
    buildingId: "new1",
    building: "Building 1",
    floor: "2nd Floor",
  },

  // 1st Floor
  {
    id: "b1-101",
    name: "B1 101",
    buildingId: "new1",
    building: "Building 1",
    floor: "1st Floor",
  },
  {
    id: "b1-102",
    name: "B1 102",
    buildingId: "new1",
    building: "Building 1",
    floor: "1st Floor",
  },
  {
    id: "b1-103",
    name: "B1 103",
    buildingId: "new1",
    building: "Building 1",
    floor: "1st Floor",
  },
  {
    id: "b1-104",
    name: "B1 104",
    buildingId: "new1",
    building: "Building 1",
    floor: "1st Floor",
  },

  /* ===================================================
     BUILDING 2
     Rooms shown on the updated Building 2 PNG.
  =================================================== */

  // 3rd Floor
  {
    id: "b2-313",
    name: "B2 313",
    buildingId: "new2",
    building: "Building 2",
    floor: "3rd Floor",
  },
  {
    id: "b2-314",
    name: "B2 314",
    buildingId: "new2",
    building: "Building 2",
    floor: "3rd Floor",
  },
  {
    id: "b2-315",
    name: "B2 315",
    buildingId: "new2",
    building: "Building 2",
    floor: "3rd Floor",
  },
  {
    id: "b2-316",
    name: "B2 316",
    buildingId: "new2",
    building: "Building 2",
    floor: "3rd Floor",
  },
  {
    id: "b2-317",
    name: "B2 317",
    buildingId: "new2",
    building: "Building 2",
    floor: "3rd Floor",
  },
  {
    id: "b2-318",
    name: "B2 318",
    buildingId: "new2",
    building: "Building 2",
    floor: "3rd Floor",
  },

  // 2nd Floor
  {
    id: "b2-212",
    name: "B2 212",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
  },
  {
    id: "b2-211",
    name: "B2 211",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
  },
  {
    id: "b2-210",
    name: "B2 210",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
  },
  {
    id: "b2-209",
    name: "B2 209",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
  },
  {
    id: "b2-208",
    name: "B2 208",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
  },
  {
    id: "b2-207",
    name: "B2 207",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
  },

  // 1st Floor
  {
    id: "b2-101",
    name: "B2 101",
    buildingId: "new2",
    building: "Building 2",
    floor: "1st Floor",
  },
  {
    id: "b2-102",
    name: "B2 102",
    buildingId: "new2",
    building: "Building 2",
    floor: "1st Floor",
  },
  {
    id: "b2-103",
    name: "B2 103",
    buildingId: "new2",
    building: "Building 2",
    floor: "1st Floor",
  },
  {
    id: "b2-104",
    name: "B2 104",
    buildingId: "new2",
    building: "Building 2",
    floor: "1st Floor",
  },
  {
    id: "b2-105",
    name: "B2 105",
    buildingId: "new2",
    building: "Building 2",
    floor: "1st Floor",
  },
  {
    id: "b2-106",
    name: "B2 106",
    buildingId: "new2",
    building: "Building 2",
    floor: "1st Floor",
  },

  /* ===================================================
     BUILDING CR
     Retained from the existing room list.
  =================================================== */

  {
    id: "cr-female-3",
    name: "Female CR3",
    buildingId: "cr",
    building: "Building CR",
    floor: "3rd Floor",
  },
  {
    id: "cr-male-3",
    name: "Male CR3",
    buildingId: "cr",
    building: "Building CR",
    floor: "3rd Floor",
  },
  {
    id: "cr-female-2",
    name: "Female CR2",
    buildingId: "cr",
    building: "Building CR",
    floor: "2nd Floor",
  },
  {
    id: "cr-male-2",
    name: "Male CR2",
    buildingId: "cr",
    building: "Building CR",
    floor: "2nd Floor",
  },
  {
    id: "cr-female-1",
    name: "Female CR1",
    buildingId: "cr",
    building: "Building CR",
    floor: "1st Floor",
  },
  {
    id: "cr-male-1",
    name: "Male CR1",
    buildingId: "cr",
    building: "Building CR",
    floor: "1st Floor",
  },
];

/* =====================================================
   SAMPLE REPORTS
   Mock data for frontend preview only.
===================================================== */

export const reports: Report[] = [
  {
    id: "report-001",
    roomId: "old-302",
    room: "302",
    buildingId: "old",
    building: "Old Building",
    floor: "3rd Floor",
    property: "Ceiling",
    description: "There is water leakage from the ceiling.",
    status: "Pending",
    date: "2026-09-05",
  },
  {
    id: "report-002",
    roomId: "old-302",
    room: "302",
    buildingId: "old",
    building: "Old Building",
    floor: "3rd Floor",
    property: "Chair",
    description: "One classroom chair is damaged.",
    status: "Verified",
    date: "2026-09-08",
  },
  {
    id: "report-003",
    roomId: "old-302",
    room: "302",
    buildingId: "old",
    building: "Old Building",
    floor: "3rd Floor",
    property: "Window",
    description: "Window glass is cracked.",
    status: "For Repair",
    date: "2026-09-10",
  },
  {
    id: "report-004",
    roomId: "b1-101",
    room: "B1 101",
    buildingId: "new1",
    building: "Building 1",
    floor: "1st Floor",
    property: "Electric Fan",
    description: "The electric fan is not functioning properly.",
    status: "Pending",
    date: "2026-09-11",
  },
  {
    id: "report-005",
    roomId: "b2-208",
    room: "B2 208",
    buildingId: "new2",
    building: "Building 2",
    floor: "2nd Floor",
    property: "Door",
    description: "The classroom door lock is damaged.",
    status: "Repaired",
    date: "2026-09-12",
  },
  {
    id: "report-006",
    roomId: "old-comlab-v1",
    room: "COMLAB - V1",
    buildingId: "old",
    building: "Old Building",
    floor: "Ground Floor",
    property: "Computer",
    description: "One computer is not turning on.",
    status: "For Repair",
    date: "2026-09-13",
  },
  {
    id: "report-007",
    roomId: "old-302",
    room: "302",
    buildingId: "old",
    building: "Old Building",
    floor: "3rd Floor",
    property: "Light",
    description: "One ceiling light is not working.",
    status: "Repaired",
    date: "2026-09-15",
  },
];

/* =====================================================
   ROOM HELPERS
===================================================== */

/**
 * Find one room using its ID.
 */
export const getRoomById = (roomId: string): Room | undefined => {
  return rooms.find((room) => room.id === roomId);
};

/**
 * Get all rooms belonging to one building.
 */
export const getRoomsByBuilding = (buildingId: string): Room[] => {
  return rooms.filter((room) => room.buildingId === buildingId);
};

/* =====================================================
   REPORT HELPERS
===================================================== */

/**
 * Get all reports belonging to one room.
 */
export const getReportsByRoom = (roomId: string): Report[] => {
  return reports.filter((report) => report.roomId === roomId);
};

/**
 * Count reports belonging to one room.
 */
export const getReportCount = (roomId: string): number => {
  return reports.filter((report) => report.roomId === roomId).length;
};

/**
 * Get all reports belonging to one building.
 */
export const getReportsByBuilding = (buildingId: string): Report[] => {
  return reports.filter((report) => report.buildingId === buildingId);
};

/**
 * Count reports belonging to one building.
 */
export const getBuildingReportCount = (buildingId: string): number => {
  return reports.filter((report) => report.buildingId === buildingId).length;
};

/* =====================================================
   BUILDING SUMMARY
===================================================== */

/**
 * Get a building together with its mock report count.
 */
export const getBuildingReportSummary = () => {
  return buildings.map((building) => ({
    ...building,
    reportCount: getBuildingReportCount(building.id),
  }));
};

/* =====================================================
   ROOM SUMMARY
===================================================== */

/**
 * Get all rooms for a building together with their mock report counts.
 * This can be used for a frontend preview of the admin map.
 */
export const getRoomReportSummary = (buildingId: string) => {
  return getRoomsByBuilding(buildingId).map((room) => ({
    ...room,
    reportCount: getReportCount(room.id),
  }));
};

/* =====================================================
   STATUS HELPERS
===================================================== */

/**
 * Count reports with a specific status.
 */
export const getReportCountByStatus = (status: ReportStatus): number => {
  return reports.filter((report) => report.status === status).length;
};

/**
 * Get all mock report status counts.
 */
export const getReportStatusSummary = () => {
  return {
    pending: getReportCountByStatus("Pending"),
    verified: getReportCountByStatus("Verified"),
    forRepair: getReportCountByStatus("For Repair"),
    repaired: getReportCountByStatus("Repaired"),
  };
};