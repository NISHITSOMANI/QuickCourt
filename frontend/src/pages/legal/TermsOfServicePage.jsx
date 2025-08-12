import React from 'react';
import Footer from '../../components/layout/Footer';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">Last updated: January 2024</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using QuickCourt ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service constitute a legally binding agreement between you and QuickCourt regarding your use of the Service.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                QuickCourt is a platform that connects sports enthusiasts with venue owners, allowing users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Browse and book sports courts and facilities</li>
                <li>Manage bookings and payments</li>
                <li>List and manage sports venues (for venue owners)</li>
                <li>Connect with other sports enthusiasts</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Booking and Payment Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When making bookings through QuickCourt:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All bookings are subject to availability and venue owner approval</li>
                <li>Payment is required at the time of booking</li>
                <li>Cancellation policies vary by venue and are clearly displayed</li>
                <li>Refunds are processed according to the venue's cancellation policy</li>
                <li>You are responsible for arriving on time for your booking</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Venue Owner Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are a venue owner using QuickCourt, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate information about your facilities</li>
                <li>Maintain your facilities in safe and playable condition</li>
                <li>Honor all confirmed bookings</li>
                <li>Respond promptly to booking requests</li>
                <li>Comply with all local laws and regulations</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not use QuickCourt for any unlawful purpose or to solicit others to perform unlawful acts. 
                You may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Violate any local, state, national, or international law</li>
                <li>Transmit, or procure the sending of, any advertising or promotional material</li>
                <li>Impersonate or attempt to impersonate the company, employees, or other users</li>
                <li>Use the service in any way that could disable, overburden, or impair the service</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                QuickCourt acts as a platform connecting users with venue owners. We are not responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>The condition or safety of sports facilities</li>
                <li>Disputes between users and venue owners</li>
                <li>Injuries or accidents that occur at venues</li>
                <li>Cancellations or changes made by venue owners</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                to understand our practices.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes 
                via email or through the Service. Your continued use of the Service after such modifications constitutes 
                acceptance of the updated terms.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@quickcourt.com<br/>
                  <strong>Address:</strong> QuickCourt Legal Department<br/>
                  123 Sports Avenue, Athletic City, AC 12345
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
