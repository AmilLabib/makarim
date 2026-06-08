import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, Clock, MapPin, RefreshCw } from "lucide-react";

interface ScheduleItem {
  id: string;
  subject: string;
  time: string;
  room: string;
  lecturer: string;
}

const AbsenPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  const [debugHtml, setDebugHtml] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    setDebugHtml(null);

    const username = import.meta.env.VITE_PORTAL_USERNAME;
    const password = import.meta.env.VITE_PORTAL_PASSWORD;

    if (!username || !password) {
      setError(
        "Username or password missing in .env file. Please add VITE_PORTAL_USERNAME and VITE_PORTAL_PASSWORD to your .env"
      );
      setLoading(false);
      return;
    }

    try {
      // 0. Fetch login page to get CSRF token and initial session cookie
      const initRes = await fetch("/portal-api/login", { credentials: "include" });
      const initHtml = await initRes.text();
      
      const initParser = new DOMParser();
      const initDoc = initParser.parseFromString(initHtml, "text/html");
      
      // Look for common CSRF token fields
      let csrfToken = "";
      let csrfName = "";
      const tokenInput = initDoc.querySelector('input[name="_token"], input[name="csrf_test_name"], input[name="ci_csrf_token"]');
      if (tokenInput) {
        csrfToken = tokenInput.getAttribute("value") || "";
        csrfName = tokenInput.getAttribute("name") || "_token";
      }

      // Check for common username field names (username, userid, nim, email)
      let userField = "username";
      if (initDoc.querySelector('input[name="userid"]')) userField = "userid";
      else if (initDoc.querySelector('input[name="nim"]')) userField = "nim";

      let passField = "password";

      // 1. Attempt to Login via proxy
      const bodyParams = new URLSearchParams();
      bodyParams.append(userField, username);
      bodyParams.append(passField, password);
      if (csrfName && csrfToken) {
        bodyParams.append(csrfName, csrfToken);
      }

      const loginPostRes = await fetch("/portal-api/login", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        },
        body: bodyParams,
        credentials: "include"
      });
      
      // 2. Fetch the actual schedule page
      const scheduleRes = await fetch("/portal-api/stud/jadkul/kulnow", { 
        credentials: "include",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        }
      });
      
      if (!scheduleRes.ok) {
        throw new Error(`Failed to fetch schedule: ${scheduleRes.status} ${scheduleRes.statusText}`);
      }

      const htmlText = await scheduleRes.text();
      // Extract all form inputs for debugging
      const formInputs = Array.from(initDoc.querySelectorAll('input')).map(input => `${input.name || input.id}=${input.value || ''}`).join(', ');

      const debugInfo = `Login Status: ${loginPostRes.status}
Schedule Status: ${scheduleRes.status}
Schedule Final URL: ${scheduleRes.url}
Schedule HTML Length: ${htmlText.length} bytes
Init HTML Length: ${initHtml.length} bytes

--- Extracted Form Inputs ---
${formInputs}

--- Init HTML (Login Page) Snippet ---
${initHtml ? initHtml.substring(0, 1000) : "(EMPTY INIT HTML)"}`;

      // If the HTML contains a login form, we probably aren't authenticated
      if (htmlText.toLowerCase().includes('type="password"') || scheduleRes.url.includes("login")) {
        setDebugHtml(debugInfo);
        throw new Error("Authentication failed. The portal returned the login page instead of the schedule. Check your credentials or the portal might use a different payload structure.");
      }

      if (!htmlText.trim()) {
        setDebugHtml(debugInfo);
        throw new Error("The portal returned a completely blank response. It might require an AJAX/API call instead of a direct page load, or the login failed silently.");
      }
      
      // 3. Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      
      // Extract data. Assuming a generic table structure.
      const rows = doc.querySelectorAll('table tr');
      const parsedSchedule: ScheduleItem[] = [];
      
      rows.forEach((row, index) => {
        // Assuming first row is header
        if (index === 0 || row.querySelectorAll('th').length > 0) return;
        
        const cols = row.querySelectorAll('td');
        if (cols.length >= 4) {
          // Adjust indices based on actual PKN STAN portal structure if needed
          parsedSchedule.push({
            id: String(index),
            subject: cols[1]?.textContent?.trim() || 'Unknown Subject',
            time: cols[2]?.textContent?.trim() || 'Unknown Time',
            room: cols[3]?.textContent?.trim() || 'Unknown Room',
            lecturer: cols[4]?.textContent?.trim() || 'Unknown Lecturer',
          });
        }
      });

      if (parsedSchedule.length > 0) {
        setSchedule(parsedSchedule);
      } else {
        setDebugHtml(htmlText);
        setSchedule([
          {
            id: "1",
            subject: "Data scraped successfully, but table format is unrecognised.",
            time: "Check DOM structure",
            room: "N/A",
            lecturer: "N/A",
          }
        ]);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch schedule. Make sure the proxy is running and you are connected to the internet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <header className="mb-8 flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-light text-gray-900 tracking-tight">Jadwal Kuliah & Absen</h2>
          <p className="text-sm text-gray-500 mt-2">Scraped from PKN STAN Portal via Vite Proxy.</p>
        </div>
        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Error scraping data</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {debugHtml && (
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-auto max-h-64 text-xs">
          <p className="font-bold mb-2 text-gray-700">Debug HTML Output (Snippet):</p>
          <pre className="text-gray-500 whitespace-pre-wrap">
            {debugHtml.substring(0, 1500)}...
          </pre>
        </div>
      )}

      {loading && !schedule.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw size={32} className="animate-spin mb-4 text-gray-300" />
          <p className="text-sm">Connecting to portal & scraping schedule...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schedule.length > 0 ? (
            schedule.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{item.subject}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span>{item.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    <span>{item.room}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{item.lecturer}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    Hari ini
                  </span>
                  <button className="text-sm font-medium text-black hover:underline">
                    Isi Kehadiran
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            !loading && !error && (
              <div className="col-span-2 text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                Tidak ada jadwal hari ini.
              </div>
            )
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AbsenPage;
