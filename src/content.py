"""All site copy and project data. Edit here, then run:  python3 src/build.py

Content rule: only facts supplied by OXE (the "What is OXE" guide and the
reference-work PDF). Where a fact is missing the value is None and the page
shows a neutral placeholder. Never add invented results, numbers or quotes.
"""

SITE = {
    "name": "OXE Marketing",
    "url": "https://www.oxemarketingth.com",
    "email": "Sales@oxemarketingth.com",
    "phone_display": "+66 82 448 0050",
    "phone_tel": "+66824480050",
    "whatsapp": "https://wa.me/66824480050?text=Hi%20OXE%20Marketing%2C%20I%27d%20like%20to%20discuss%20a%20project.",
    "city": "Bangkok, Thailand",
    "founded": "2020",
    # TODO: add the real profile URLs (leave "" to hide an icon)
    "social": {"facebook": "", "instagram": "", "tiktok": "", "linkedin": ""},
}

NAV = [("index.html", "Home"), ("services.html", "Services"), ("portfolio.html", "Portfolio"),
       ("about.html", "About Us"), ("contact.html", "Contact")]

HERO = {
    "eyebrow": "Digital marketing agency in Bangkok",
    "title": 'Helping businesses build a stronger digital presence in a <span class="hl">connected world.</span>',
    "text": "OXE Marketing is a multicultural marketing agency in Bangkok helping businesses grow through websites, visual content, and digital storytelling.",
}

# ------------------------------------------------------------------ SERVICES
SERVICES = [
    dict(key="web", num="01", art="web", img="tailor-website", title="Website Design &amp; Development",
         short="Modern, responsive websites that look great, perform well, and convert visitors into customers.",
         intro="Modern, responsive websites that build credibility and turn visitors into enquiries, optimised for mobile devices and search engines, and easy for your team to update.",
         what=["Business websites", "Landing pages", "Mobile responsive design", "SEO foundations", "Contact forms", "Booking integrations"],
         deliverables=["Custom website design", "Responsive build on WordPress / Elementor", "Contact &amp; booking forms", "SEO-friendly structure", "Google Analytics set-up", "Launch support"],
         process=["Discovery", "Design", "Build", "Launch"]),
    dict(key="social", num="02", art="social", img="haji-strawberry", title="Social Media Marketing",
         short="Strategic campaigns that increase visibility, engage audiences, and drive business growth.",
         intro="Strategic social media that keeps your brand visible and relevant across Facebook, Instagram, TikTok and LinkedIn, from content planning to publishing.",
         what=["Content creation", "Social media strategy", "Monthly management", "Photography", "Short-form videos"],
         deliverables=["Content strategy &amp; calendar", "Designed posts &amp; stories", "Short-form video", "Photography", "Meta advertising", "Monthly management &amp; reporting"],
         process=["Strategy", "Content plan", "Create", "Publish &amp; review"]),
    dict(key="video", num="03", art="video", img="bts-video-2", title="Video Production",
         short="Engaging videos that tell your story and bring your brand to life, from commercials to social media content.",
         intro="High-quality video that captures attention and tells your story, managed end to end: concept, storyboard, filming, editing and colour grading.",
         what=["Promotional videos", "Product videos", "Brand storytelling", "Event coverage", "Corporate videos"],
         deliverables=["Creative concept &amp; storyboard", "Filming (incl. drone where needed)", "Editing &amp; motion graphics", "Colour grading", "Cut-downs for social media"],
         process=["Concept", "Pre-production", "Filming", "Post-production"]),
    dict(key="photo", num="04", art="photo", img="cake-strawberry-wide", title="Photography",
         short="High-quality photography for brands, products, events, and more.",
         intro="Commercial photography that makes your products, food, spaces and people look their best across your website, social media and print.",
         what=["Product photography", "Food &amp; beverage", "Events", "Real estate &amp; interiors", "Lifestyle &amp; portraits"],
         deliverables=["Shot list &amp; styling plan", "On-location or studio shoot", "Professional retouching", "Web- and social-ready files"],
         process=["Brief", "Plan &amp; style", "Shoot", "Retouch &amp; deliver"]),
    dict(key="strategy", num="05", art="strategy", img="social-insights", title="Digital Strategy",
         short="Customised marketing plans that combine creativity, data, and industry insights for measurable growth.",
         intro="Customised marketing plans that combine creativity, data and industry insight, including advertising, influencer marketing, SEO and campaign management.",
         what=["Marketing strategy", "Advertising (Meta)", "Influencer &amp; talent sourcing", "SEO", "Press releases &amp; blogging"],
         deliverables=["Marketing plan &amp; channel mix", "Campaign set-up &amp; optimisation", "Talent &amp; influencer coordination", "Performance reporting"],
         process=["Audit", "Plan", "Launch", "Optimise"]),
]

INDUSTRIES = [("suit", "Tailors"), ("gem2", "Jewelry"), ("dish", "Restaurants"), ("building", "Hospitality"),
              ("tie", "Professional Services"), ("plane", "Businesses entering Thailand")]

# ------------------------------------------------------------------ WHY OXE
WHY = {
    "title": 'A multicultural team with a <span class="hl">shared vision</span>',
    "text": "We're a team of creators, strategists, and problem-solvers from different backgrounds, united by a passion for helping businesses grow in the digital world.",
    "principles": [
        ("bulb", "Creative &amp; Innovative", "Creativity combined with data-driven marketing, so the work looks exceptional and performs."),
        ("results", "Results Driven", "Every strategy is built around your goals, so your investment generates real value."),
        ("shield", "Transparent &amp; Reliable", "Clear communication, honest advice, and reliable support at every stage."),
        ("people", "People Focused", "Long-term partnerships: as your business grows, we keep refining the strategy with you."),
    ],
}

# ------------------------------------------------------------------ ABOUT
ABOUT = {
    "positioning": "OXE Marketing is an ASEAN-based multicultural creative and digital agency headquartered in Bangkok.",
    "intro": "Powered by a proactive and passionate team, we believe that in today's world, having no digital presence is like opening a business without telling anyone. Our goal is simple: to help clients build a strong brand identity, gain a competitive edge, and maximise their revenue through creative digital strategies.",
    "story": [
        "Founded in 2020, OXE Marketing is a full-service creative and digital marketing agency dedicated to helping businesses build strong brands and achieve sustainable growth. We combine strategic thinking with creative execution to deliver marketing solutions that make a lasting impact.",
        "Our expertise spans website design and development, social media marketing, professional video production, and commercial photography. Whether you're launching a new business, refreshing your brand, or expanding your online presence, we create customised strategies designed to connect with your audience.",
        "We believe every brand has a unique story worth telling. By understanding your business goals, industry, and customers, we develop digital experiences that not only look great but also deliver real business value.",
    ],
    "mission": "Helping businesses establish their presence, connect with audiences, and grow through digital strategy.",
    "vision": "To become Thailand's trusted partner for modern digital marketing while delivering real results.",
    "facts": [("2020", "Founded"), ("Bangkok", "Headquarters"), ("ASEAN", "Regional focus"), ("5", "Core services")],
    "choose": [
        ("results", "Results-Driven Approach", "Every strategy is built with your goals in mind."),
        ("bulb", "Creative &amp; Strategic", "Creativity combined with data-driven marketing."),
        ("layers", "All-in-One Partner", "Websites, social media, video and photography under one roof."),
        ("sliders", "Tailored for You", "Strategies designed around your industry, audience and objectives."),
        ("award2", "Professional Quality", "Attention to detail from design to production."),
        ("chat", "Transparent Communication", "You always know the progress of your project."),
        ("calendar", "Experienced Since 2020", "Helping businesses build stronger brands since our founding."),
        ("handshake2", "Long-Term Partnership", "We keep refining strategies as your business grows."),
    ],
}

# ------------------------------------------------------------------ CONTACT FORM
SERVICE_OPTIONS = ["Website Design &amp; Development", "Social Media Marketing", "Video Production", "Photography",
                   "Branding &amp; Creative Design", "Other"]
# TODO: confirm budget ranges with OXE
BUDGETS = ["Under ฿30,000", "฿30,000 – ฿80,000", "฿80,000 – ฿150,000", "฿150,000+", "Not sure yet"]

# ------------------------------------------------------------------ PORTFOLIO
# cat: space-separated filter keys (web social video photo)
# media: cover image, extra gallery images, optional video (assets/video/<name>.mp4 + <name>-poster.jpg)
# challenge / solution / outcome: None when OXE hasn't supplied it yet
FILTERS = [("all", "All"), ("web", "Web Design"), ("social", "Social Media"), ("video", "Video"), ("photo", "Photography")]

PROJECTS = [
    dict(id="tailor-website", client="Local Tailor Business, Bangkok", title="Tailor Website", cat="web", category="Website Design",
         cover="tailor-website", mobile="tailor-website-mobile", gallery=[], video=None, device=True,
         summary="A professional website that showcases craftsmanship and makes it easy for customers to book appointments.",
         challenge="Limited digital presence and few channels for online enquiries.",
         solution="Designed a professional website to establish a stronger online presence and showcase their craftsmanship.",
         outcome="Improved credibility and gave customers an easier way to discover the business online and book appointments.",
         tags=["Web Design", "UI/UX", "Booking Integration"],
         services=["Website Design", "UI/UX Design", "Responsive Development", "Booking Integration", "SEO-Friendly Structure"]),

    dict(id="xiaomi-redmi-watch", client="Xiaomi", title="Redmi Watch 2 Lite Campaign Video", cat="video", category="Video Production",
         cover="xiaomi-campaign", gallery=["wearable-breathing", "wearable-waterproof"], video="xiaomi-redmi-watch",
         summary="End-to-end promotional video production for the Redmi Watch 2 Lite, from concept to final edit.",
         challenge="Create engaging, lifestyle-driven content that showcased the smartwatch's key features while appealing to Xiaomi's target audience across digital and social media platforms.",
         solution="OXE managed every stage: creative concept, storyboard, production planning, talent sourcing, location coordination, filming and post-production, combining cinematic visuals with product-focused storytelling to highlight the watch's design, fitness capabilities and everyday functionality.",
         outcome="Content optimised for multiple digital channels: a polished, high-quality campaign aligned with Xiaomi's global brand standards.",
         tags=["Video Production", "Campaign", "Talent Casting"],
         services=["Creative Concept Development", "Storyboard Creation", "Full Video Production", "Model &amp; Talent Casting", "Production Planning &amp; Coordination", "Professional Cinematography", "Product Lifestyle Filming", "Video Editing &amp; Motion Graphics", "Color Grading", "Social Media Content Optimization"]),

    dict(id="rockers-supercars", client="Rockers Supercars", title="Promotional Video Production", cat="video photo", category="Video Production",
         cover="shoot-1", gallery=["shoot-2"], video="rockers-supercars",
         summary="Promotional video content capturing the excitement, luxury, and performance of an exclusive supercar collection.",
         challenge="Create visually striking content that resonates with automotive enthusiasts while elevating the brand's presence across digital platforms.",
         solution="From pre-production planning to filming and post-production editing, each vehicle was showcased through cinematic visuals, dynamic camera movements, and attention to detail, with premium storytelling and polished editing.",
         outcome="Videos optimised for social media, websites, and digital marketing campaigns that reflect the prestige and energy of the Rockers Supercars brand.",
         tags=["Video Production", "Drone", "Automotive"],
         services=["Commercial Video Production", "Cinematic Automotive Videography", "Creative Concept Development", "Drone Footage", "Professional Editing &amp; Color Grading", "Social Media Video Content", "Promotional Brand Videos", "Multi-Platform Content Delivery"]),

    dict(id="vincenzo-russo", client="Vincenzo Russo", title="Personal Brand &amp; Blog Website", cat="web", category="Website Design",
         cover="vincenzo-russo-site", mobile="vincenzo-russo-site-mobile", gallery=[], video=None, device=True,
         summary="A modern blog website reflecting his personal brand and expertise in gemstones and fine jewellery.",
         challenge="Create a professional online presence where visitors can explore his insights, stories, and industry knowledge while reinforcing his credibility as a trusted voice in gems and jewels.",
         solution="A clean, elegant design with responsive performance across all devices and a content-focused structure that makes it easy to publish and discover articles, built with SEO, fast loading speeds, and a user-friendly experience in mind.",
         outcome="A platform that can grow alongside his brand and audience.",
         tags=["Web Design", "Blog", "SEO"],
         services=["Website Design &amp; Development", "UI/UX Design", "Responsive Development", "Blog &amp; Content Management", "SEO-Friendly Website Structure", "Performance Optimization", "Brand-Focused Visual Design"]),

    dict(id="haji-cafe", client="Haji Café", title="Café Social Media &amp; Photography", cat="social photo", category="Social Media",
         cover="haji-strawberry", gallery=["haji-made-with-love", "haji-your-choice", "cake-strawberry-wide", "haji-matcha", "haji-menu", "haji-chocolate", "cake-chocolate"], video="haji-cafe",
         summary="Branded social media graphics, menu design, dessert photography and video for a Bangkok café.",
         challenge=None, solution=None, outcome=None,
         tags=["Social Media", "Photography", "Graphic Design"],
         services=["Social Media Content", "Graphic Design", "Menu Design", "Food Photography", "Video"]),

    dict(id="oppo", client="OPPO", title="Influencer &amp; Talent Campaign Support", cat="social", category="Influencer &amp; Talent",
         cover="influencer-talent", gallery=[], video=None,
         summary="Influencer, model, and talent sourcing for a promotional campaign.",
         challenge="Ensure the campaign featured the right personalities to authentically represent the product while delivering engaging, high-quality content.",
         solution="Working closely with the campaign team, OXE managed the talent selection process, coordinated communications, and supported production logistics, carefully matching influencers and models to the campaign objectives.",
         outcome="A smooth and efficient shoot, with content that maintained OPPO's premium brand identity.",
         tags=["Influencer Marketing", "Talent Casting"],
         services=["Influencer Sourcing", "Model &amp; Talent Casting", "Talent Management &amp; Coordination", "Campaign Planning Support", "Production Coordination", "Shoot Scheduling &amp; Logistics", "Brand &amp; Talent Matching"]),

    dict(id="icy-lemonade", client="Icy Lemonade", title="Talent Scouting, Social Media &amp; Performance Marketing", cat="social", category="Social Media",
         cover="social-insights", gallery=[], video=None,
         summary="Talent sourcing, social media content and Meta advertising for an energetic, youthful drinks brand.",
         challenge="Increase brand awareness, build audience engagement, and drive business growth across digital platforms.",
         solution="OXE sourced models and content creators aligned with the brand's identity, created content for Instagram, Facebook, and TikTok, and planned, launched, and optimised Meta advertising campaigns, continuously refining targeting, creative, and strategy.",
         outcome="A stronger online presence built on creative content combined with data-driven marketing.",
         tags=["Social Media", "Meta Ads", "Talent"],
         services=["Talent &amp; Model Scouting", "Influencer Sourcing &amp; Coordination", "Social Media Content Creation", "Photography &amp; Short-Form Video", "Content Strategy &amp; Planning", "Meta (Facebook &amp; Instagram) Advertising", "Performance Marketing", "Campaign Optimization &amp; Analytics"]),

    dict(id="stratton", client="Stratton Gems &amp; Jewellery", title="Social Media, Live Streaming &amp; Talent Management", cat="social", category="Social Media",
         cover="stratton-logo", gallery=[], video=None, logo=True,
         summary="Social media marketing, live-stream campaigns, and influencer collaborations for a jewellery brand.",
         challenge="Increase brand awareness, engage audiences in real time, and showcase the beauty and craftsmanship of the jewellery collection through interactive digital experiences.",
         solution="OXE managed social media content planning, supported the execution of live streaming events, and sourced and coordinated influencers, presenters, and on-screen talent whose style and audience aligned with the brand.",
         outcome="Authentic, engaging live shopping experiences that expanded the brand's reach and strengthened its connection with existing and potential customers.",
         tags=["Social Media", "Live Streaming", "Talent"],
         services=["Social Media Marketing", "Content Strategy &amp; Planning", "Social Media Content Creation", "Live Streaming Campaign Support", "Influencer Sourcing &amp; Collaboration", "Talent &amp; Presenter Scouting", "Live Stream Production Coordination", "Campaign Management"]),

    dict(id="anthony-bespoke-tailor", client="Anthony Bespoke Tailor", title="Website Design &amp; Development", cat="web", category="Website Design",
         cover=None, gallery=[], video=None,  # TODO: add website screenshots
         summary="A premium website showcasing the brand's services, tailoring process, and portfolio, with enquiry and appointment booking.",
         challenge="Create a sophisticated online presence that showcases the brand's services, tailoring process, and portfolio while providing a seamless experience for prospective clients.",
         solution="A custom, luxury-inspired design with intuitive navigation and a fully responsive layout, built for performance, security, and scalability, with strategically placed calls-to-action, an enquiry and appointment booking system, service pages, and an SEO-friendly structure.",
         outcome="A professional digital platform that strengthens the brand's credibility and makes it easier for clients to connect with Anthony Bespoke Tailor.",
         tags=["Web Design", "Booking", "UI/UX"],
         services=["Custom Website Design", "Website Development", "UI/UX Design", "Responsive Development", "SEO-Friendly Website Structure", "Performance Optimization", "Contact &amp; Appointment Integration", "Ongoing Website Support &amp; Maintenance"]),

    # ---- Real OXE media without a written case study yet (shown after "View More Projects")
    dict(id="dh-foods", client="Dh Foods", title="Sauce Product Photography &amp; Social Content", cat="social photo", category="Photography", extra=True,
         cover="dh-table", gallery=["dh-honey-bbq", "dh-sauce"], video=None,
         summary="Product photography and social media creatives for a sauce and marinade range.",
         challenge=None, solution=None, outcome=None, tags=["Photography", "Social Media"],
         services=["Product Photography", "Social Media Content", "Graphic Design"]),
    dict(id="gaia-tribe", client="Gaia Tribe", title="Instagram Campaign Graphics", cat="social", category="Social Media", extra=True,
         cover="gaia-huge", gallery=["gaiatribe-day", "gaia-flavours"], video=None,
         summary="Campaign graphics and creator content for a plant-based nutrition brand.",
         challenge=None, solution=None, outcome=None, tags=["Social Media", "Graphic Design"],
         services=["Social Media Content", "Graphic Design", "Creator Content"]),
    dict(id="wirever", client="Wirever", title="Product Photography", cat="photo", category="Photography", extra=True,
         cover="wirever-packaging", gallery=["wirever-lifestyle", "wirever-rgb"], video=None,
         summary="Studio and lifestyle photography for cable-management accessories.",
         challenge=None, solution=None, outcome=None, tags=["Photography", "Product"],
         services=["Product Photography", "Lifestyle Photography", "Retouching"]),
    dict(id="wine-connection", client="Wine Connection", title="Restaurant Promo Video", cat="video", category="Video Production", extra=True,
         cover="wine-connection-poster", gallery=[], video="wine-connection",
         summary="A short, social-first promotional video of food, drinks, and atmosphere.",
         challenge=None, solution=None, outcome=None, tags=["Video Production", "Food &amp; Beverage"],
         services=["Video Production", "Editing", "Social Media Video"]),
    dict(id="event-coverage", client="Technology launch event", title="Event Coverage", cat="video photo", category="Video Production", extra=True,
         cover="event-stage", gallery=[], video=None,
         summary="Photo and video coverage of a live stage event in Bangkok.",
         challenge=None, solution=None, outcome=None, tags=["Event Coverage"],
         services=["Event Coverage", "Photography", "Video"]),
    dict(id="corporate-video", client="Corporate client", title="Corporate Interview Video", cat="video", category="Video Production", extra=True,
         cover="bts-video-2", gallery=["bts-video-1"], video=None,
         summary="A multi-camera interview shoot with professional lighting and direction.",
         challenge=None, solution=None, outcome=None, tags=["Corporate Video"],
         services=["Corporate Video", "Multi-Camera Filming", "Lighting &amp; Sound", "Editing"]),
]

FEATURED = "tailor-website"

# ------------------------------------------------------------------ CLIENTS
# Logos from OXE's "some of our clients and partners" page (reference-work PDF).
# (file in assets/img/clients/, brand name). None = name not confirmed yet:
# the logo is shown without alt text. TODO: ask OXE for those brand names.
CLIENTS = [
    ("xiaomi", "Xiaomi"), ("oppo", "OPPO"), ("netflix", "Netflix"), ("minor-international", "Minor International"),
    ("the-continent", "The Continent"), ("rockers", "Rockers Supercars"),
    ("stratton", "Stratton Gems &amp; Jewels"), ("dh-foods", "Dh Foods"), ("wirever", "Wirever"),
    ("michael-tailors", "Michael Tailors"), ("russos", "Russo's Gemstones"), ("lalisa", "Lalisa"),
    ("alchemi-botanics", "Alchemi Botanics"), ("commonzcent", "Commonzcent"), ("nakhon-thai", "Nakhon Thai"),
    ("shoeswedo", "Shoeswedo"), ("bmb", "BMB Bangkok Morocco"),
    ("client-wolf", None), ("client-brush", None), ("client-gown", None), ("client-star", None),
    ("client-figure", None), ("client-y", None),
]

# ------------------------------------------------------------------ HOME: OUR WORKS
# (portfolio filter key, card title, cover image in assets/img/work)
WORK_CATEGORIES = [
    ("web", "Web Design", "tailor-website"),
    ("social", "Social Media", "haji-strawberry"),
    ("video", "Video Production", "xiaomi-campaign"),
    ("photo", "Photography", "cake-strawberry-wide"),
]
