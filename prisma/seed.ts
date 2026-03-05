import { PrismaClient } from "../src/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const PROFILE_SARAH = "a1000000-0000-0000-0000-000000000001";
const PROFILE_JAKE = "a1000000-0000-0000-0000-000000000002";
const PROFILE_EMMA = "a1000000-0000-0000-0000-000000000003";

const PROP_TAHOE = "b1000000-0000-0000-0000-000000000001";
const PROP_CAPECOD = "b1000000-0000-0000-0000-000000000002";

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPref.deleteMany();
  await prisma.bulletinPost.deleteMany();
  await prisma.propertyPage.deleteMany();
  await prisma.watchedRange.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.recurringHold.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.propertyMember.deleteMany();
  await prisma.property.deleteMany();
  await prisma.profile.deleteMany();

  // Profiles
  await prisma.profile.createMany({
    data: [
      { id: PROFILE_SARAH, fullName: "Sarah Mitchell", email: "sarah@example.com" },
      { id: PROFILE_JAKE, fullName: "Jake Mitchell", email: "jake@example.com" },
      { id: PROFILE_EMMA, fullName: "Emma Rodriguez", email: "emma@example.com" },
    ],
  });

  // Properties
  await prisma.property.createMany({
    data: [
      {
        id: PROP_TAHOE,
        name: "Lake Tahoe Cabin",
        slug: "lake-tahoe-cabin",
        description: "A cozy 4-bedroom cabin on the north shore of Lake Tahoe with private dock access and mountain views.",
        address: "1234 Lakeshore Blvd, Tahoe City, CA 96145",
        cleaningGapDays: 3,
      },
      {
        id: PROP_CAPECOD,
        name: "Cape Cod Beach House",
        slug: "cape-cod-beach-house",
        description: "A charming 3-bedroom beach house steps from the ocean in Chatham, Cape Cod.",
        address: "56 Shore Road, Chatham, MA 02633",
        cleaningGapDays: 2,
      },
    ],
  });

  // Members: Tahoe - Sarah=admin, Jake=member, Emma=member
  // Cape Cod - Sarah=admin, Jake=admin, Emma=member
  await prisma.propertyMember.createMany({
    data: [
      { propertyId: PROP_TAHOE, profileId: PROFILE_SARAH, role: "admin" },
      { propertyId: PROP_TAHOE, profileId: PROFILE_JAKE, role: "member" },
      { propertyId: PROP_TAHOE, profileId: PROFILE_EMMA, role: "member" },
      { propertyId: PROP_CAPECOD, profileId: PROFILE_SARAH, role: "admin" },
      { propertyId: PROP_CAPECOD, profileId: PROFILE_JAKE, role: "admin" },
      { propertyId: PROP_CAPECOD, profileId: PROFILE_EMMA, role: "member" },
    ],
  });

  // Reservations
  await prisma.reservation.createMany({
    data: [
      {
        propertyId: PROP_TAHOE,
        requestedBy: PROFILE_JAKE,
        checkIn: "2026-07-10",
        checkOut: "2026-07-17",
        guestCount: 4,
        status: "approved",
        notes: "Family vacation with the kids. Bringing kayaks.",
        approvedBy: PROFILE_SARAH,
        approvedAt: new Date(),
      },
      {
        propertyId: PROP_TAHOE,
        requestedBy: PROFILE_EMMA,
        checkIn: "2026-08-01",
        checkOut: "2026-08-08",
        guestCount: 2,
        status: "pending",
        notes: "Anniversary trip with my partner.",
      },
      {
        propertyId: PROP_CAPECOD,
        requestedBy: PROFILE_SARAH,
        checkIn: "2026-06-20",
        checkOut: "2026-06-27",
        guestCount: 6,
        status: "approved",
        notes: "Big family reunion weekend.",
        approvedBy: PROFILE_JAKE,
        approvedAt: new Date(),
      },
      {
        propertyId: PROP_CAPECOD,
        requestedBy: PROFILE_EMMA,
        checkIn: "2026-07-04",
        checkOut: "2026-07-11",
        guestCount: 3,
        status: "pending",
        notes: "Fourth of July celebration.",
      },
    ],
  });

  // Recurring holds
  await prisma.recurringHold.createMany({
    data: [
      {
        propertyId: PROP_TAHOE,
        heldFor: PROFILE_SARAH,
        createdBy: PROFILE_SARAH,
        label: "Sarah's July 4th Week",
        patternType: "specific_date",
        patternConfig: JSON.stringify({ month: 7, day: 4, duration_days: 5 }),
      },
      {
        propertyId: PROP_CAPECOD,
        heldFor: PROFILE_JAKE,
        createdBy: PROFILE_SARAH,
        label: "Jake's Cape Cod August Week",
        patternType: "week_of_month",
        patternConfig: JSON.stringify({ month: 8, week: 1, duration_days: 7 }),
      },
    ],
  });

  // Property pages
  await prisma.propertyPage.createMany({
    data: [
      {
        propertyId: PROP_TAHOE, slug: "rules", title: "House Rules", sortOrder: 1,
        content: `<h2>General Rules</h2><ul><li>No smoking inside the cabin</li><li>Quiet hours: 10 PM - 8 AM</li><li>Maximum occupancy: 10 guests</li><li>Pets allowed with prior approval</li></ul><h2>Kitchen</h2><ul><li>Please wash all dishes before departure</li><li>Take out trash and recycling</li></ul><h2>Water Sports</h2><ul><li>Life jackets must be worn on all watercraft</li><li>Kayaks and paddle boat must be pulled up and secured after use</li><li>End-of-summer guests: please pull all watercraft out of the water and store in the boathouse</li></ul>`,
      },
      {
        propertyId: PROP_TAHOE, slug: "contacts", title: "Emergency Contacts", sortOrder: 2,
        content: `<h2>Emergency</h2><ul><li><strong>911</strong> - Police/Fire/Medical</li><li><strong>Tahoe Forest Hospital</strong>: (530) 587-6011</li></ul><h2>Property</h2><ul><li><strong>Property Manager (Dave)</strong>: (530) 555-0123</li><li><strong>Plumber (Mike's Plumbing)</strong>: (530) 555-0456</li><li><strong>Electrician</strong>: (530) 555-0789</li></ul>`,
      },
      {
        propertyId: PROP_TAHOE, slug: "maintenance", title: "Maintenance Info", sortOrder: 3,
        content: `<h2>Heating</h2><p>The cabin uses a central gas furnace. Thermostat is in the hallway. Keep at 62°F minimum in winter.</p><h2>Wi-Fi</h2><p>Network: <strong>TahoeCabin5G</strong><br/>Password: <strong>LakeLife2024!</strong></p><h2>Departure Checklist</h2><ul><li>All windows locked</li><li>Thermostat set to 62°F</li><li>All lights off</li><li>Trash taken to bear-proof bins</li><li>Water sports gear secured</li></ul>`,
      },
      {
        propertyId: PROP_CAPECOD, slug: "rules", title: "House Rules", sortOrder: 1,
        content: `<h2>General Rules</h2><ul><li>No shoes on hardwood floors</li><li>Outdoor shower for sandy feet</li><li>Beach chairs/umbrellas go back in the garage</li><li>Maximum occupancy: 8 guests</li></ul><h2>Beach Access</h2><ul><li>Private beach path - gate code is 4567</li></ul>`,
      },
      {
        propertyId: PROP_CAPECOD, slug: "contacts", title: "Emergency Contacts", sortOrder: 2,
        content: `<h2>Emergency</h2><ul><li><strong>911</strong></li><li><strong>Cape Cod Hospital</strong>: (508) 771-1800</li></ul><h2>Property</h2><ul><li><strong>Caretaker (Tom)</strong>: (508) 555-0111</li></ul>`,
      },
      {
        propertyId: PROP_CAPECOD, slug: "maintenance", title: "Maintenance Info", sortOrder: 3,
        content: `<h2>AC</h2><p>Central air with zones. Upstairs and downstairs thermostats are independent.</p><h2>Wi-Fi</h2><p>Network: <strong>CapeHouse</strong><br/>Password: <strong>BeachDays2024</strong></p>`,
      },
    ],
  });

  // Bulletin posts
  await prisma.bulletinPost.createMany({
    data: [
      {
        propertyId: PROP_TAHOE, authorId: PROFILE_SARAH,
        title: "Dock Repair Scheduled",
        body: "The dock will be undergoing repairs June 1-5. Please avoid using the boat during this time.",
      },
      {
        propertyId: PROP_TAHOE, authorId: PROFILE_SARAH,
        title: "New Bear-Proof Trash Bins",
        body: "We've upgraded to new bear-proof trash bins at the road. Lift the handle UP then pull forward.",
      },
      {
        propertyId: PROP_CAPECOD, authorId: PROFILE_SARAH,
        title: "Beach Erosion Update",
        body: "The town is doing beach replenishment in May. Access may be limited for a couple weeks.",
      },
    ],
  });

  // Notification preferences
  await prisma.notificationPref.createMany({
    data: [
      { profileId: PROFILE_SARAH, emailEnabled: true, inAppEnabled: true },
      { profileId: PROFILE_JAKE, emailEnabled: true, inAppEnabled: true },
      { profileId: PROFILE_EMMA, emailEnabled: false, inAppEnabled: true },
    ],
  });

  // Sample notifications
  await prisma.notification.createMany({
    data: [
      {
        profileId: PROFILE_SARAH, propertyId: PROP_TAHOE,
        type: "request_submitted", title: "New Reservation Request",
        body: "Emma Rodriguez has requested Aug 1-8 at Lake Tahoe Cabin.",
      },
      {
        profileId: PROFILE_SARAH, propertyId: PROP_CAPECOD,
        type: "request_submitted", title: "New Reservation Request",
        body: "Emma Rodriguez has requested Jul 4-11 at Cape Cod Beach House.",
      },
    ],
  });

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        propertyId: PROP_TAHOE, actorId: PROFILE_SARAH,
        action: "reservation_approved", targetType: "reservation",
        metadata: JSON.stringify({ requester: "Jake Mitchell", dates: "Jul 10-17" }),
      },
      {
        propertyId: PROP_CAPECOD, actorId: PROFILE_JAKE,
        action: "reservation_approved", targetType: "reservation",
        metadata: JSON.stringify({ requester: "Sarah Mitchell", dates: "Jun 20-27" }),
      },
    ],
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
