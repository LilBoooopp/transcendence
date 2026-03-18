import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Transcendence platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">2. User Conduct and Fair Play</h2>
          <p>
            Transcendence is built around competitive and fair multiplayer experiences. By playing on our platform, you agree to the following rules of conduct:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>No Cheating:</strong> You may not use external software, bots, AI engines (other than the official in-game Stockfish bot integration provided to you), or memory alteration tools to gain an unfair advantage in matchmaking or live games.</li>
            <li><strong>Respectful Behavior:</strong> Harassment, hate speech, spamming, and toxic behavior in chats or usernames are strictly prohibited.</li>
            <li><strong>Account Integrity:</strong> You are entirely responsible for maintaining the confidentiality of your login credentials. Account sharing to manipulate matchmaking or rankings is not allowed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">3. Termination of Accounts</h2>
          <p>
            We reserve the right to suspend or permanently terminate your account, without prior notice, if we determine that you have violated any of these terms, including the use of unauthorized third-party tools to manipulate game results.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">4. Limitation of Liability</h2>
          <p>
            The platform is provided on an "as is" and "as available" basis as part of a school project curriculum. We make no guarantees regarding server uptime, the permanence of your data (such as Elo ratings or match history), or uninterrupted service. We shall not be liable for any data loss or disruption resulting from platform updates or server maintenance.
          </p>
        </section>
      </div>
    </div>
  );
}