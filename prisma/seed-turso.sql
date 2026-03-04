-- Profiles
INSERT INTO profiles (id, fullName, email, createdAt) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Sarah Mitchell', 'sarah@example.com', datetime('now')),
  ('a1000000-0000-0000-0000-000000000002', 'Jake Mitchell', 'jake@example.com', datetime('now')),
  ('a1000000-0000-0000-0000-000000000003', 'Emma Rodriguez', 'emma@example.com', datetime('now'));

-- Properties
INSERT INTO properties (id, name, slug, description, address, cleaningGapDays, createdAt) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Lake Tahoe Cabin', 'lake-tahoe-cabin', 'A cozy 4-bedroom cabin on the north shore of Lake Tahoe with private dock access and mountain views.', '1234 Lakeshore Blvd, Tahoe City, CA 96145', 3, datetime('now')),
  ('b1000000-0000-0000-0000-000000000002', 'Cape Cod Beach House', 'cape-cod-beach-house', 'A charming 3-bedroom beach house steps from the ocean in Chatham, Cape Cod.', '56 Shore Road, Chatham, MA 02633', 2, datetime('now'));

-- Property members
INSERT INTO property_members (id, propertyId, profileId, role, isActive, joinedAt) VALUES
  ('c1000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'admin', 1, datetime('now')),
  ('c1000002', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'member', 1, datetime('now')),
  ('c1000003', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'member', 1, datetime('now')),
  ('c1000004', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'admin', 1, datetime('now')),
  ('c1000005', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'admin', 1, datetime('now')),
  ('c1000006', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'member', 1, datetime('now'));

-- Reservations
INSERT INTO reservations (id, propertyId, requestedBy, checkIn, checkOut, guestCount, status, notes, approvedBy, approvedAt, createdAt, updatedAt) VALUES
  ('d1000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', '2026-07-10', '2026-07-17', 4, 'approved', 'Family vacation with the kids. Bringing kayaks.', 'a1000000-0000-0000-0000-000000000001', datetime('now'), datetime('now'), datetime('now')),
  ('d1000002', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', '2026-08-01', '2026-08-08', 2, 'pending', 'Anniversary trip with my partner.', NULL, NULL, datetime('now'), datetime('now')),
  ('d1000003', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', '2026-06-20', '2026-06-27', 6, 'approved', 'Big family reunion weekend.', 'a1000000-0000-0000-0000-000000000002', datetime('now'), datetime('now'), datetime('now')),
  ('d1000004', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', '2026-07-04', '2026-07-11', 3, 'pending', 'Fourth of July celebration.', NULL, NULL, datetime('now'), datetime('now'));

-- Recurring holds
INSERT INTO recurring_holds (id, propertyId, heldFor, createdBy, label, patternType, patternConfig, skippedYears, createdAt) VALUES
  ('e1000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sarah''s July 4th Week', 'specific_date', '{"month":7,"day":4,"duration_days":5}', '[]', datetime('now')),
  ('e1000002', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Jake''s Cape Cod August Week', 'week_of_month', '{"month":8,"week":1,"duration_days":7}', '[]', datetime('now'));

-- Property pages
INSERT INTO property_pages (id, propertyId, slug, title, content, sortOrder, isAdminOnly, updatedAt) VALUES
  ('f1000001', 'b1000000-0000-0000-0000-000000000001', 'rules', 'House Rules', '<h2>General Rules</h2><ul><li>No smoking inside the cabin</li><li>Quiet hours: 10 PM - 8 AM</li><li>Maximum occupancy: 10 guests</li><li>Pets allowed with prior approval</li></ul><h2>Kitchen</h2><ul><li>Please wash all dishes before departure</li><li>Take out trash and recycling</li></ul><h2>Water Sports</h2><ul><li>Life jackets must be worn on all watercraft</li><li>Kayaks and paddle boat must be pulled up and secured after use</li><li>End-of-summer guests: please pull all watercraft out of the water and store in the boathouse</li></ul>', 1, 0, datetime('now')),
  ('f1000002', 'b1000000-0000-0000-0000-000000000001', 'contacts', 'Emergency Contacts', '<h2>Emergency</h2><ul><li><strong>911</strong> - Police/Fire/Medical</li><li><strong>Tahoe Forest Hospital</strong>: (530) 587-6011</li></ul><h2>Property</h2><ul><li><strong>Property Manager (Dave)</strong>: (530) 555-0123</li><li><strong>Plumber</strong>: (530) 555-0456</li></ul>', 2, 0, datetime('now')),
  ('f1000003', 'b1000000-0000-0000-0000-000000000001', 'maintenance', 'Maintenance Info', '<h2>Heating</h2><p>Central gas furnace. Thermostat in the hallway. Keep at 62F minimum in winter.</p><h2>Wi-Fi</h2><p>Network: <strong>TahoeCabin5G</strong><br/>Password: <strong>LakeLife2024!</strong></p>', 3, 0, datetime('now')),
  ('f1000004', 'b1000000-0000-0000-0000-000000000002', 'rules', 'House Rules', '<h2>General Rules</h2><ul><li>No shoes on hardwood floors</li><li>Outdoor shower for sandy feet</li><li>Beach chairs go back in the garage</li><li>Maximum occupancy: 8 guests</li></ul>', 1, 0, datetime('now')),
  ('f1000005', 'b1000000-0000-0000-0000-000000000002', 'contacts', 'Emergency Contacts', '<h2>Emergency</h2><ul><li><strong>911</strong></li><li><strong>Cape Cod Hospital</strong>: (508) 771-1800</li></ul><h2>Property</h2><ul><li><strong>Caretaker (Tom)</strong>: (508) 555-0111</li></ul>', 2, 0, datetime('now')),
  ('f1000006', 'b1000000-0000-0000-0000-000000000002', 'maintenance', 'Maintenance Info', '<h2>AC</h2><p>Central air with zones.</p><h2>Wi-Fi</h2><p>Network: <strong>CapeHouse</strong><br/>Password: <strong>BeachDays2024</strong></p>', 3, 0, datetime('now'));

-- Bulletin posts
INSERT INTO bulletin_posts (id, propertyId, authorId, title, body, isArchived, createdAt) VALUES
  ('g1000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dock Repair Scheduled', 'The dock will be undergoing repairs June 1-5. Please avoid using the boat during this time.', 0, datetime('now')),
  ('g1000002', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'New Bear-Proof Trash Bins', 'We''ve upgraded to new bear-proof trash bins at the road. Lift the handle UP then pull forward.', 0, datetime('now')),
  ('g1000003', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Beach Erosion Update', 'The town is doing beach replenishment in May. Access may be limited for a couple weeks.', 0, datetime('now'));

-- Notification prefs
INSERT INTO notification_prefs (id, profileId, emailEnabled, inAppEnabled) VALUES
  ('h1000001', 'a1000000-0000-0000-0000-000000000001', 1, 1),
  ('h1000002', 'a1000000-0000-0000-0000-000000000002', 1, 1),
  ('h1000003', 'a1000000-0000-0000-0000-000000000003', 0, 1);

-- Notifications
INSERT INTO notifications (id, profileId, propertyId, type, title, body, isRead, createdAt) VALUES
  ('i1000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'request_submitted', 'New Reservation Request', 'Emma Rodriguez has requested Aug 1-8 at Lake Tahoe Cabin.', 0, datetime('now')),
  ('i1000002', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'request_submitted', 'New Reservation Request', 'Emma Rodriguez has requested Jul 4-11 at Cape Cod Beach House.', 0, datetime('now'));

-- Activity logs
INSERT INTO activity_logs (id, propertyId, actorId, action, targetType, metadata, createdAt) VALUES
  ('j1000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'reservation_approved', 'reservation', '{"requester":"Jake Mitchell","dates":"Jul 10-17"}', datetime('now')),
  ('j1000002', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'reservation_approved', 'reservation', '{"requester":"Sarah Mitchell","dates":"Jun 20-27"}', datetime('now'));
