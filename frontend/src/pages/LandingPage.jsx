import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  ArrowRight,
  Star,
  Trophy,
  Users,
  Heart,
  Target,
  Zap,
  ChevronDown
} from 'lucide-react'

const LandingPage = () => {
  const [currentQuote, setCurrentQuote] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const sportsQuotes = [
    {
      text: "Champions aren't made in the gyms. Champions are made from something deep inside them - a desire, a dream, a vision.",
      author: "Muhammad Ali"
    },
    {
      text: "The only way to prove that you're a good sport is to lose.",
      author: "Ernie Banks"
    },
    {
      text: "You miss 100% of the shots you don't take.",
      author: "Wayne Gretzky"
    },
    {
      text: "It's not whether you get knocked down; it's whether you get up.",
      author: "Vince Lombardi"
    }
  ]

  const benefits = [
    {
      icon: Heart,
      title: "Physical Health",
      description: "Improve cardiovascular health, build strength, and maintain a healthy weight through regular sports activities."
    },
    {
      icon: Users,
      title: "Social Connection",
      description: "Build lasting friendships, develop teamwork skills, and connect with like-minded individuals."
    },
    {
      icon: Target,
      title: "Mental Focus",
      description: "Enhance concentration, reduce stress, and boost mental clarity through sports participation."
    },
    {
      icon: Trophy,
      title: "Achievement",
      description: "Set goals, overcome challenges, and experience the satisfaction of personal accomplishment."
    }
  ]

  const blogs = [
    {
      title: "The Science Behind Sports and Mental Health",
      excerpt: "Discover how regular physical activity through sports can significantly improve your mental well-being and cognitive function.",
      readTime: "5 min read",
      image: "https://via.placeholder.com/400x250"
    },
    {
      title: "Building Community Through Sports",
      excerpt: "Learn how sports bring people together, create lasting bonds, and strengthen communities across the globe.",
      readTime: "4 min read",
      image: "https://via.placeholder.com/400x250"
    },
    {
      title: "From Beginner to Pro: Your Sports Journey",
      excerpt: "A comprehensive guide to starting your sports journey, setting goals, and achieving your athletic potential.",
      readTime: "7 min read",
      image: "https://via.placeholder.com/400x250"
    }
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % sportsQuotes.length)
    }, 4000)

    // Add smooth scrolling to html element
    document.documentElement.style.scrollBehavior = 'smooth'

    return () => {
      clearInterval(interval)
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [sportsQuotes.length])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offsetTop = element.offsetTop - 80 // 80px offset from top
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
  }

  const handleQuickLinkClick = (e, sectionId) => {
    e.preventDefault()
    scrollToSection(sectionId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-20"></div>

        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          {/* Logo/Brand */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-4 shadow-2xl">
              <span className="text-white font-bold text-2xl">Q</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
              QuickCourt
            </h1>
          </div>

          {/* Quote Carousel */}
          <div className={`mb-12 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative h-32 flex items-center justify-center">
              {sportsQuotes.map((quote, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${index === currentQuote ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'
                    }`}
                >
                  <blockquote className="text-xl md:text-2xl text-white/90 italic text-center max-w-4xl mb-4">
                    "{quote.text}"
                  </blockquote>
                  <cite className="text-white/80 font-semibold">— {quote.author}</cite>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Link
              to="/register"
              className="group bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <span>Sign In</span>
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className={`transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <button
              onClick={() => scrollToSection('benefits')}
              className="text-white/60 hover:text-white transition-colors animate-bounce"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Sports Matter
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sports are more than just games. They're a pathway to a healthier, happier, and more connected life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <div
                  key={index}
                  className="group bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <div className="bg-primary-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blogs" className="py-20 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Sports Insights
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the latest insights, tips, and stories from the world of sports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <article
                key={index}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-r from-primary-600 to-primary-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="bg-white/90 text-primary-600 text-xs px-3 py-1 rounded-full font-medium">
                      {blog.readTime}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{blog.excerpt}</p>
                  <button className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-12 text-white">
            <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of athletes who have transformed their lives through sports. Your adventure begins with a single step.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-gray-100 px-10 py-4 rounded-lg font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Join QuickCourt Today
              </Link>
              <Link
                to="/login"
                className="bg-white/10 backdrop-blur-sm text-white px-10 py-4 rounded-lg font-semibold text-lg border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300"
              >
                Already a Member?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Q</span>
                </div>
                <span className="text-2xl font-bold">QuickCourt</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Your premier destination for booking sports courts and facilities.
                Making sports accessible to everyone, everywhere.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={(e) => handleQuickLinkClick(e, 'benefits')}
                    className="text-gray-400 hover:text-white transition-colors text-left"
                  >
                    Why Sports Matter
                  </button>
                </li>
                <li>
                  <button
                    onClick={(e) => handleQuickLinkClick(e, 'blogs')}
                    className="text-gray-400 hover:text-white transition-colors text-left"
                  >
                    Sports Insights
                  </button>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="text-center">
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} QuickCourt. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
