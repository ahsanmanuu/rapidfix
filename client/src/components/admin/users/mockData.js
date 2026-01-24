export const MembershipTier = {
    FREE: 'Free',
    PREMIUM: 'Premium'
};

export const UserStatus = {
    ACTIVE: 'Active',
    BANNED: 'Banned',
    INACTIVE: 'Inactive'
};

export const JobStatus = {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected'
};

export const MOCK_USERS = [
    {
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCV-cxI3sjzLYa7oX-naCNRzotXx5Hp5pwdyASk9bRnAY6E1XGwGUfbPoWKaZZSUlgSDlmzIXI_7uoQ-bOZgLvPQ0MDleXitRsITP5mWGsjdCPqir7AFcMWJqP775ZPrDhz5GAVS_wcfhoTwaoqd7lhbCRXrryoo3sriFVICu4ADY_c_TH0t2uZU2qYSmaL3OqO5MQIGShV6igVeChqpQhtGQSNC9ZZtRfOucJoWAuQY9k6MqSDxxcII_05cAGCMmQ8Rcs9wCG-bKs',
        membership: MembershipTier.PREMIUM,
        walletBalance: 450.00,
        status: UserStatus.ACTIVE,
        lastActive: '2 mins ago',
        jobs: [
            {
                id: 'JOB-8291',
                title: 'AC Repair - Unit 4B',
                status: JobStatus.IN_PROGRESS,
                scheduledAt: 'Tomorrow, 10:00 AM'
            },
            {
                id: 'JOB-8210',
                title: 'Heater Installation',
                status: JobStatus.REJECTED,
                scheduledAt: '2 days ago',
                reason: 'Technician unavailable in region.'
            }
        ]
    },
    {
        id: '2',
        name: 'John Smith',
        email: 'john.s@test.com',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmypmY29-Jaln9eDmf3aBstk9NSaedjhiLZcgXf3gWKdn0PMSvrvdUsLjcrC0y-OMgpnAltHPJxYtfjcIMhysSMonL0VnwpoyRz58fBSeaEKnF5x8x57RSVKxsdskD6_V6Es1CTHsb30qa4a8R1AqA5XdPAh2wMuy-tmkyfpl2xSoanQ-eBkx_wZSeZOfTkwa1CHLgm6Pasdl-EkyRvbZkHQ9Bc-kXIGs1Nr29d1IrhgavZHaPXtcJ2cOEdLynSyiO0kp-T3Eukhg',
        membership: MembershipTier.FREE,
        walletBalance: 0.00,
        status: UserStatus.ACTIVE,
        lastActive: '1 day ago',
        jobs: []
    },
    {
        id: '3',
        name: 'Arthur Boyle',
        email: 'art.b@domain.net',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDI-0Wnl1lmHVqk_QHkp5COQDqODx0r3CRSbH95nV0FXgvjLjsHDO4WDmae9mB62ofj2YZZBk7OAhsFlmYwSMfYqQzrVeziS9hbFndl4vnh75RtASsWKt5-qwsDGETSKsl4Sk6hog_CAYxKcXbab9MATuwQFN-mTD7WAqdidqOhHtYju7IHF7K-IYNM5v3aDAafPytCsy_VQuCrT_TqkebNf7_nHZUbeK7PkG_4K-VcqzYiVZWD2jxIX-1G18Xxay30z7gIxQxpXI',
        membership: MembershipTier.PREMIUM,
        walletBalance: 120.50,
        status: UserStatus.BANNED,
        lastActive: '1 month ago',
        jobs: []
    },
    {
        id: '4',
        name: 'Samantha Wu',
        email: 'sam.wu@tech.co',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaGDax-GMDGQQ8Gx1-6rc6igJ2ifyXAifNBjD_LiqRBkwaANGa4b6gVHkoRCZE9nmcemTjMg6rAiSz2ZX3mPE45rvDOqZpDuuk-kTJZ6WK4yh9ioTfdvJUmkDJUI4qED7QwUxJILNNsY0Dni8UklqEUO9sw0y58fnT8bxCw8kudFS-F18YW1Gn0JSHND2EjtSZqVC_8AbvcB5-JfkhJ5NI2FsPU44tywYljfIWJHaHzoltzKlffVAlRMZQpBXggaW3HF25-jw0m1U',
        membership: MembershipTier.FREE,
        walletBalance: 25.00,
        status: UserStatus.ACTIVE,
        lastActive: '3 hours ago',
        jobs: []
    }
];
