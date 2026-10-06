export type CampusHotspot = {
  id: string;
  name: string;
  type: "building" | "facility";

  x: number;
  y: number;
  width: number;
  height: number;

  // Used only when the hotspot is a facility.
  // Facilities are stored in Laravel as rooms
  // under the "Campus Facilities" building.
  reportBuildingId?: string;
  reportBuildingName?: string;
  reportRoomId?: string;
  reportRoomName?: string;
};

// Coordinates use the original Campus_Map.png pixel dimensions: 2000 × 2000.
// x/y are the top-left corner of each hotspot.

export const CAMPUS_HOTSPOTS: CampusHotspot[] = [
  // =========================================================
  // BUILDINGS
  // =========================================================

  {
    id: "building1",
    name: "Building 1",
    type: "building",
    x: 1187,
    y: 45,
    width: 494,
    height: 232,
  },

  {
    id: "building2",
    name: "Building 2",
    type: "building",
    x: 1659,
    y: 925,
    width: 326,
    height: 776,
  },

  {
    id: "oldBuilding",
    name: "Old Building",
    type: "building",
    x: 995,
    y: 1640,
    width: 555,
    height: 314,
  },

  {
    id: "buildingCR",
    name: "Building CRs",
    type: "building",
    x: 1556,
    y: 1730,
    width: 328,
    height: 195,
  },

  // =========================================================
  // UPPER-LEFT FACILITIES
  // =========================================================

  {
    id: "male-cr1",
    name: "Male CR1",
    type: "facility",
    x: 584,
    y: 18,
    width: 132,
    height: 77,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "male-cr1",
    reportRoomName: "Male CR1",
  },

  {
    id: "female-cr1",
    name: "Female CR1",
    type: "facility",
    x: 506,
    y: 101,
    width: 126,
    height: 91,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "female-cr1",
    reportRoomName: "Female CR1",
  },

  {
    id: "rv1",
    name: "RV1",
    type: "facility",
    x: 737,
    y: 99,
    width: 132,
    height: 113,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "rv1",
    reportRoomName: "RV1",
  },

  {
    id: "physics-lab",
    name: "Physics Lab",
    type: "facility",
    x: 888,
    y: 102,
    width: 122,
    height: 108,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "physics-lab",
    reportRoomName: "Physics Lab",
  },

  {
    id: "chem-lab",
    name: "Chem Lab",
    type: "facility",
    x: 1033,
    y: 102,
    width: 128,
    height: 110,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "chem-lab",
    reportRoomName: "Chem Lab",
  },

  {
    id: "clinic",
    name: "Clinic",
    type: "facility",
    x: 545,
    y: 206,
    width: 125,
    height: 101,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "clinic",
    reportRoomName: "Clinic",
  },

  {
    id: "cashier",
    name: "Cashier",
    type: "facility",
    x: 536,
    y: 315,
    width: 142,
    height: 115,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "cashier",
    reportRoomName: "Cashier",
  },

  {
    id: "osa",
    name: "OSA",
    type: "facility",
    x: 538,
    y: 436,
    width: 139,
    height: 117,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "osa",
    reportRoomName: "OSA",
  },

  {
    id: "library",
    name: "Library",
    type: "facility",
    x: 544,
    y: 562,
    width: 125,
    height: 273,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "library",
    reportRoomName: "Library",
  },

  {
    id: "ict-room",
    name: "ICT Room",
    type: "facility",
    x: 341,
    y: 622,
    width: 169,
    height: 180,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "ict-room",
    reportRoomName: "ICT Room",
  },

  // =========================================================
  // LEFT-SIDE FACILITIES
  // =========================================================

  {
    id: "storage-house",
    name: "Storage House",
    type: "facility",
    x: 19,
    y: 224,
    width: 112,
    height: 395,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "storage-house",
    reportRoomName: "Storage House",
  },

  {
    id: "parking-area",
    name: "Parking Area",
    type: "facility",
    x: 136,
    y: 280,
    width: 369,
    height: 314,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "parking-area",
    reportRoomName: "Parking Area",
  },

  {
    id: "guard-house",
    name: "Guard House",
    type: "facility",
    x: 36,
    y: 826,
    width: 211,
    height: 210,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "guard-house",
    reportRoomName: "Guard House",
  },

  {
    id: "canteen",
    name: "Canteen",
    type: "facility",
    x: 81,
    y: 1213,
    width: 275,
    height: 289,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "canteen",
    reportRoomName: "Canteen",
  },

  {
    id: "radio-house",
    name: "Radio House",
    type: "facility",
    x: 17,
    y: 1796,
    width: 187,
    height: 194,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "radio-house",
    reportRoomName: "Radio House",
  },

  // =========================================================
  // COURTYARD AND RIGHT-SIDE FACILITIES
  // =========================================================

  {
    id: "courtyard",
    name: "Courtyard",
    type: "facility",
    x: 1191,
    y: 357,
    width: 333,
    height: 548,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "courtyard",
    reportRoomName: "Courtyard",
  },

  {
    id: "female-cr2",
    name: "Female CR2",
    type: "facility",
    x: 1702,
    y: 50,
    width: 136,
    height: 113,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "female-cr2",
    reportRoomName: "Female CR2",
  },

  {
    id: "male-cr2",
    name: "Male CR2",
    type: "facility",
    x: 1858,
    y: 48,
    width: 130,
    height: 115,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "male-cr2",
    reportRoomName: "Male CR2",
  },

  {
    id: "faculty",
    name: "Faculty",
    type: "facility",
    x: 1838,
    y: 206,
    width: 139,
    height: 200,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "faculty",
    reportRoomName: "Faculty",
  },

  {
    id: "guidance-room",
    name: "Guidance Room",
    type: "facility",
    x: 1838,
    y: 418,
    width: 137,
    height: 119,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "guidance-room",
    reportRoomName: "Guidance Room",
  },

  {
    id: "rv5",
    name: "RV5",
    type: "facility",
    x: 1828,
    y: 556,
    width: 147,
    height: 152,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "rv5",
    reportRoomName: "RV5",
  },

  {
    id: "rv6",
    name: "RV6",
    type: "facility",
    x: 1821,
    y: 723,
    width: 154,
    height: 157,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "rv6",
    reportRoomName: "RV6",
  },

  // =========================================================
  // LOWER-CAMPUS FACILITIES
  // =========================================================

  {
    id: "male-cr3",
    name: "Male CR3",
    type: "facility",
    x: 266,
    y: 1796,
    width: 108,
    height: 109,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "male-cr3",
    reportRoomName: "Male CR3",
  },

  {
    id: "female-cr3",
    name: "Female CR3",
    type: "facility",
    x: 383,
    y: 1796,
    width: 92,
    height: 109,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "female-cr3",
    reportRoomName: "Female CR3",
  },

  {
    id: "rv2",
    name: "RV2",
    type: "facility",
    x: 487,
    y: 1781,
    width: 156,
    height: 131,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "rv2",
    reportRoomName: "RV2",
  },

  {
    id: "rv3",
    name: "RV3",
    type: "facility",
    x: 661,
    y: 1781,
    width: 158,
    height: 131,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "rv3",
    reportRoomName: "RV3",
  },

  {
    id: "rv4",
    name: "RV4",
    type: "facility",
    x: 839,
    y: 1781,
    width: 149,
    height: 131,

    reportBuildingId: "campus-facilities",
    reportBuildingName: "Campus Facilities",
    reportRoomId: "rv4",
    reportRoomName: "RV4",
  },
];