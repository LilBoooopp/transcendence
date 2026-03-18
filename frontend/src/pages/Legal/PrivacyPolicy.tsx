import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">1. Information We Collect</h2>
          <p>
            When you register and use the Transcendence platform, we collect information necessary to provide you with the services. This includes:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Account Information:</strong> Your chosen username, email address, and authentication credentials (such as standard passwords or 42 Intra OAuth tokens).</li>
            <li><strong>Gameplay Data:</strong> Match history, win/loss records, Elo ratings, and in-game statistics.</li>
            <li><strong>Social Data:</strong> Your friends list, blocked users, and public profile data you choose to share.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
          <p>We use the collected information solely to operate and improve our platform:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To manage your account, authenticate your login, and secure our system.</li>
            <li>To facilitate matchmaking, record game outcomes, and update global leaderboards.</li>
            <li>To provide social features, such as chatting with other players and managing your friends list.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">3. Data Sharing and Protection</h2>
          <p>
            We take your privacy seriously. Your personal information is not sold to or shared with third-party advertisers. Your username, avatar, game statistics, and match history are considered public information on the platform and may be visible to other registered players on leaderboards and user profiles. 
          </p>
          <p className="mt-2">
            We implement industry-standard security measures, including secure socket layer (SSL) technology and JWT-based authentication, to protect your data against unauthorized access or disclosure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">4. Your Rights</h2>
          <p>
            You have the right to access the data we store about you and request its deletion. If you wish to delete your account or retrieve your data, please contact the site administrators or use the account management features provided in your user profile.
          </p>
        </section>
      </div>
    </div>
  );
}