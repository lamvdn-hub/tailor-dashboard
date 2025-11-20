import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#13171B]">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E8EAE7] mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 dark:text-[#B7BAAE]">Last updated: November 2025</p>
        </div>

        <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              By using Tailor Notebook, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">2. Description of Service</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE] mb-2">
              Tailor Notebook is a management system for tailoring businesses, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 dark:text-[#B7BAAE]">
              <li>Client management</li>
              <li>Measurement tracking</li>
              <li>Session and order management</li>
              <li>Fabric inventory management</li>
              <li>Task and query tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">3. User Accounts</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>Users must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate information</li>
                <li>Keep login credentials secure</li>
                <li>Notify the provider of unauthorized access</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">4. Access and Availability</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              Access is granted via email invitation.
              The service may be modified or updated at any time to maintain security, performance, or compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">5. Responsibilities of the Controller (Tailor)</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>The controller agrees to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the service lawfully</li>
                <li>Inform clients their data is stored in Tailor Notebook</li>
                <li>Obtain any required permissions</li>
                <li>Respond to GDPR requests</li>
                <li>Ensure accuracy of client data</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">6. Data Ownership</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 dark:text-[#B7BAAE]">
              <li>The controller owns all client and business data entered into the system.</li>
              <li>The processor owns the platform code, design, and infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">7. Data Protection and GDPR Compliance</h2>
            <div className="space-y-4 text-gray-700 dark:text-[#B7BAAE]">
              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">The processor:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Processes data only on documented instructions</li>
                  <li>Implements security measures</li>
                  <li>Ensures sub-processors meet GDPR standards</li>
                  <li>Provides tools for access, export, and deletion</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">The controller:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Determines data retention</li>
                  <li>Ensures lawful collection of client data</li>
                  <li>Handles all data subject requests</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">8. Backups and Security</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                Tailor Notebook maintains secure, regular backups.
              </p>
              <p>
                Controllers may also export data for their own local backups.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">9. Prohibited Use</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE] mb-2">Users may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700 dark:text-[#B7BAAE]">
              <li>Store illegal content</li>
              <li>Enter data without lawful basis</li>
              <li>Attempt to bypass security controls</li>
              <li>Upload malicious code</li>
              <li>Misuse other users' data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">10. Service Modifications</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              Features may be added, updated, or deprecated.
              Significant changes will be communicated to users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">11. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                The service is provided "as is."
              </p>
              <p>The processor is not liable for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Indirect or consequential damages</li>
                <li>Business losses</li>
                <li>User errors</li>
                <li>Incorrect data entered by controllers</li>
                <li>Client disputes</li>
              </ul>
              <p>
                The processor remains responsible for maintaining reasonable security and proper handling
                of personal data as required by GDPR.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">12. Indemnification</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              Controllers indemnify the processor for claims arising from unlawful data entry or misuse of the system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">13. Termination</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                The controller may delete their account at any time.
              </p>
              <p>Upon deletion:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All data is permanently removed</li>
                <li>Backups are purged according to the processor's retention schedule</li>
              </ul>
              <p>
                The processor may suspend accounts for security threats or policy violations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">14. Governing Law</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              These Terms are governed by Swedish law and GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">15. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              Material changes will be communicated prior to taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">16. Contact</h2>
            <p className="text-gray-700 dark:text-[#B7BAAE]">
              For questions relating to these Terms, contact Tailor Notebook support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">17. Security Logging</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                Tailor Notebook implements essential security logging to maintain service reliability and detect unauthorized access. Logged events include authentication attempts, access timestamps, and system error events. These logs are used exclusively for security and operational safety.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">18. Personal Data Breaches</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                If Tailor Notebook identifies a personal data breach involving data processed on behalf of the tailoring business, it will notify the Data Controller <span className="font-medium">without undue delay</span>.
              </p>
              <p>
                The controller is responsible for regulatory reporting and communication with affected individuals in accordance with GDPR. Tailor Notebook will provide all necessary technical details to support this process.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7] mb-3">19. Data Retention</h2>
            <div className="space-y-3 text-gray-700 dark:text-[#B7BAAE]">
              <p>
                The tailoring business (Data Controller) is responsible for determining and communicating data retention rules for client information.
              </p>
              <p className="font-medium text-gray-900 dark:text-[#E8EAE7]">Tailor Notebook (Data Processor):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Retains data only while the controller's account is active</li>
                <li>Permanently deletes data upon account termination or upon documented instruction from the controller</li>
                <li>Ensures backup deletion follows internal purge cycles</li>
                <li>Provides data export tools for the controller</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
