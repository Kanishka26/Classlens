import { useNavigate } from 'react-router-dom'
import { Brain, Eye, BarChart2, Bell, Video, FileText, ArrowRight, Zap } from 'lucide-react'

const features = [
  { icon: <Brain size={24} className="text-indigo-400" />, title: 'AI Engagement Detection', desc: 'Real-time analysis of student attention using advanced computer vision and emotion recognition.' },
  { icon: <Eye size={24} className="text-indigo-400" />, title: 'Eye & Gaze Tracking', desc: "Monitor where students are looking to ensure they're focused on the lesson content." },
  { icon: <BarChart2 size={24} className="text-indigo-400" />, title: 'Live Analytics Dashboard', desc: 'See engagement scores, trends, and insights as your class progresses in real-time.' },
  { icon: <Bell size={24} className="text-indigo-400" />, title: 'Smart Alerts', desc: 'Get notified when students become distracted so you can re-engage them immediately.' },
  { icon: <Video size={24} className="text-indigo-400" />, title: 'Virtual Classroom', desc: 'Built-in video conferencing with all the features you need for effective online teaching.' },
  { icon: <FileText size={24} className="text-indigo-400" />, title: 'Detailed Reports', desc: 'Generate comprehensive after-class reports with actionable insights for every session.' },
]

const steps = [
  { num: '01', title: 'Create Your Class', desc: 'Set up your virtual classroom in seconds and get a unique join code.' },
  { num: '02', title: 'Students Join', desc: 'Share the code or link. Students join with camera enabled for tracking.' },
  { num: '03', title: 'AI Monitors Engagement', desc: 'Our AI analyzes attention, emotions, and posture in real-time.' },
  { num: '04', title: 'Get Insights', desc: 'View live dashboards, receive alerts, and download detailed reports.' },
]

const benefits = [
  'Increase student engagement by up to 40%',
  'Identify struggling students early',
  'Data-driven teaching improvements',
  'Save hours on manual attendance tracking',
  'Privacy-first approach with ethical AI',
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0f1123] text-white">

      {/* Navbar */}
      <nav className="bg-[#1a1d35]/90 backdrop-blur border-b border-[#2d3155] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#f43f5e', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M4 16 Q8 8, 16 8 Q24 8, 28 16" stroke="url(#grad1)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M6 20 Q10 14, 16 14 Q22 14, 26 20" stroke="url(#grad1)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M8 24 Q12 20, 16 20 Q20 20, 24 24" stroke="url(#grad1)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span style={{
            background: 'linear-gradient(90deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block'
          }} className="text-base sm:text-xl font-bold">ClassLens</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white text-xs sm:text-sm transition-colors px-3 sm:px-4 py-2">
            Sign In
          </button>
          <button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl transition-colors">
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero with background image */}
      <section className="relative min-h-[80vh] sm:min-h-[85vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=1600&q=80"
          alt="Virtual classroom"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1123]/70 via-[#0f1123]/75 to-[#0f1123]" />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="inline-flex items-center gap-1 sm:gap-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6">
            <Zap size={14} /> AI-Powered Student Engagement
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Understand your students<br />
            <span style={{
              background: 'linear-gradient(90deg, #00d9ff 0%, #00ffa3 50%, #00d9ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block'
            }}>like never before</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg lg:text-xl max-w-2xl mx-auto mb-6 sm:mb-10">
            ClassLens uses AI to monitor student engagement in real-time during virtual classes — helping teachers identify struggling students and improve learning outcomes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-14">
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-lg transition-colors">
              <Zap size={18} /> Start Teaching Free
            </button>
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#2d3155] hover:border-indigo-500 text-slate-300 hover:text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-lg transition-colors">
              Join as Student <ArrowRight size={18} />
            </button>
          </div>

          {/* Floating stat cards */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="w-full sm:w-auto bg-[#1a1d35]/90 backdrop-blur border border-[#2d3155] rounded-xl px-4 sm:px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">87</div>
              <div className="text-left">
                <p className="text-white text-xs sm:text-sm font-semibold">Class Engagement</p>
                <p className="text-slate-400 text-xs">Above average</p>
              </div>
            </div>
            <div className="w-full sm:w-auto bg-[#1a1d35]/90 backdrop-blur border border-[#2d3155] rounded-xl px-4 sm:px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-lg flex-shrink-0">👥</div>
              <div className="text-left">
                <p className="text-white text-xs sm:text-sm font-semibold">24 Students</p>
                <p className="text-slate-400 text-xs">22 focused</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview image */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 mb-12 sm:mb-20 relative z-10">
        <div className="rounded-2xl overflow-hidden border border-[#2d3155] shadow-2xl shadow-indigo-900/20">
          <img
            src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=1400&q=80"
            alt="ClassLens dashboard preview"
            className="w-full object-cover opacity-80"
            style={{ maxHeight: '300px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1123] via-transparent to-transparent rounded-2xl" />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#2d3155]">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">
            Everything you need to <span style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block'
            }}>engage students</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg">Powerful AI tools designed specifically for educators.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-[#1a1d35] border border-[#2d3155] hover:border-indigo-500/50 rounded-xl p-4 sm:p-6 transition-colors">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-base sm:text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#2d3155]">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">
            How <span style={{
              background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block'
            }}>ClassLens</span> works
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg">Get started in minutes with our simple 4-step process.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <p className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#2d3155] mb-3">{step.num}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 text-[#2d3155] text-2xl">→</div>
              )}
              <h3 className="text-white font-semibold text-base sm:text-lg mb-2">{step.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Teachers Love ClassLens */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t border-[#2d3155]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">
              Why teachers <span style={{
                background: 'linear-gradient(90deg, #f43f5e 0%, #ec4899 50%, #f43f5e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block'
              }}>love</span> <span style={{
                background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block'
              }}>ClassLens</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mb-6 sm:mb-8">Join thousands of educators who have transformed their virtual classrooms with AI-powered engagement insights.</p>
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <span className="text-slate-300 text-xs sm:text-sm">{b}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-colors">
              <ArrowRight size={18} /> Get Started Now
            </button>
          </div>

          {/* Right side - image with overlay badge */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-[#2d3155]">
              <img
                src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80"
                alt="Teacher using ClassLens"
                className="w-full object-cover"
                style={{ height: '300px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1123]/60 to-transparent rounded-2xl" />
            </div>
            {/* Privacy badge */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 bg-[#1a1d35]/95 backdrop-blur border border-[#2d3155] rounded-xl px-3 sm:px-4 py-2 flex items-center gap-2">
              <span className="text-lg sm:text-xl">🛡️</span>
              <div>
                <p className="text-white text-xs sm:text-sm font-semibold">Privacy First</p>
                <p className="text-slate-400 text-xs">No video stored</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-[#1a1d35] border border-[#2d3155] rounded-2xl p-6 sm:p-12 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-transparent to-indigo-900/20 pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 relative z-10">
            Ready to transform your <span style={{
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block'
            }}>classroom?</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg mb-6 sm:mb-8 relative z-10">Join ClassLens today and start understanding your students like never before.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 relative z-10">
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-lg transition-colors">
              <Zap size={20} /> Start Teaching Free
            </button>
            <button onClick={() => navigate('/login')}
              className="w-full sm:w-auto border border-[#2d3155] hover:border-indigo-500 text-slate-300 hover:text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-lg transition-colors">
              Join as Student
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d3155] px-4 sm:px-6 py-6 text-center text-slate-500 text-xs sm:text-sm">
        © 2026 ClassLens — Team Echoform, Dronacharya College of Engineering
      </footer>
    </div>
  )
}