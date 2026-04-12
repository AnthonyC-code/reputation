export const MOCK_PASSPORT = {
  owner: "CSk1sRsPLQyMA9JP5NhxVdh1HdfEyRYhpEsg46hvk3F7",
  overallScore: 75,
  totalGigs: 12,
  disputeCount: 1,
  totalEarned: 3_116_000_000,   // lamports
  createdAt: 1700000000,
  lastUpdated: Math.floor(Date.now() / 1000),
  badgeCount: 3,
  sumRatings: 54,
  uniquePlatforms: 3,
  categoryGigs: [5, 3, 2, 1, 1], // Tech, Design, Language, Teaching, Other
};

export const MOCK_RECORDS = [
  { category: "Tech",     rating: 5, disputed: false, platform: "Soleer Mock",    amountPaid: 500_000_000, timestamp: Date.now()/1000 - 86400   },
  { category: "Design",   rating: 4, disputed: false, platform: "Gibwork Mock",   amountPaid: 300_000_000, timestamp: Date.now()/1000 - 172800  },
  { category: "Tech",     rating: 5, disputed: false, platform: "Superteam Mock", amountPaid: 250_000_000, timestamp: Date.now()/1000 - 259200  },
  { category: "Language", rating: 5, disputed: false, platform: "Soleer Mock",    amountPaid: 100_000_000, timestamp: Date.now()/1000 - 345600  },
  { category: "Tech",     rating: 4, disputed: false, platform: "Gibwork Mock",   amountPaid: 400_000_000, timestamp: Date.now()/1000 - 432000  },
  { category: "Design",   rating: 3, disputed: true,  platform: "Superteam Mock", amountPaid: 150_000_000, timestamp: Date.now()/1000 - 518400  },
  { category: "Teaching", rating: 5, disputed: false, platform: "Soleer Mock",    amountPaid: 200_000_000, timestamp: Date.now()/1000 - 604800  },
  { category: "Tech",     rating: 5, disputed: false, platform: "Gibwork Mock",   amountPaid: 350_000_000, timestamp: Date.now()/1000 - 691200  },
  { category: "Other",    rating: 4, disputed: false, platform: "Superteam Mock", amountPaid:  80_000_000, timestamp: Date.now()/1000 - 777600  },
  { category: "Tech",     rating: 5, disputed: false, platform: "Soleer Mock",    amountPaid: 600_000_000, timestamp: Date.now()/1000 - 864000  },
  { category: "Design",   rating: 4, disputed: false, platform: "Gibwork Mock",   amountPaid: 220_000_000, timestamp: Date.now()/1000 - 950400  },
  { category: "Language", rating: 5, disputed: false, platform: "Superteam Mock", amountPaid: 130_000_000, timestamp: Date.now()/1000 - 1036800 },
];

export const MOCK_BADGES = ["FirstGig", "MultiPlatform", "DomainExpert"];
