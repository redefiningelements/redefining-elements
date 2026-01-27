(() => {
  const chat = document.getElementById("egChat");
  const input = document.getElementById("egInput");
  const sendBtn = document.getElementById("egSend");
  if (!chat || !input || !sendBtn) return;

  let step = "start";
  let flowType = null;

  /* ========= STATE ========= */
  let areas = new Set();
  let material = null;
  let concreteSqft = 0;
  let paverSqft = 0;
  let paverTier = null;

  let wallQueue = [];
  let currentWall = null;

  let stepsLf = 0;
  let features = new Set();

  // Design
  let designSqft = 0;

  // Lead
  let lead = {
    first: "",
    last: "",
    phone: "",
    email: "",
    address: ""
  };



/* ========= PRICING ========= */
const PRICING = {
  concrete: 22, // $ / sqft
  pavers: {
    Basic: 25,
    Mid: 30,
    Premium: 40
  }
};

const RANGE_PERCENT = 0.15; // ±15%






/* ========= EMAIL SUBMIT ========= */
const FORM_SUBMIT_URL = "https://formsubmit.co/ajax/redefiningelements@gmail.com";

function sendEstimateEmail() {
  fetch(FORM_SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      _subject: "New Ballpark Estimate Submission",
      _template: "table",
      _captcha: "false",

      "First Name": lead.first,
      "Last Name": lead.last,
      "Phone": lead.phone,
      "Email": lead.email,
      "Address": lead.address,

      "Estimator Type": flowType === "design" ? "Design Ballpark" : "Build Ballpark",
      "Areas": [...areas].join(", "),
      "Material": material || "N/A",
      "Concrete Sq Ft": concreteSqft || 0,
      "Paver Sq Ft": paverSqft || 0,
      "Paver Tier": paverTier || "N/A",
      "Steps (LF)": stepsLf || 0,
      "Features": features.size ? [...features].join(", ") : "None"
    })
  })
  .then(() => console.log("✅ Email sent"))
  .catch(err => console.error("❌ Email error:", err));
}





function resetEstimator(){
  step = "start";
  flowType = null;

  areas.clear();
  material = null;
  concreteSqft = 0;
  paverSqft = 0;
  paverTier = null;

  wallQueue = [];
  currentWall = null;
  stepsLf = 0;
  features.clear();

  designSqft = 0;

  lead = {
    first: "",
    last: "",
    phone: "",
    email: "",
    address: ""
  };

  chat.innerHTML = "";
  bot("Hi — I’m Element Ballpark Genie.");
  bot("Choose an estimator to begin:");
  actions([
    {label:"Design Ballpark", value:"design", primary:true},
    {label:"Build Ballpark", value:"build"}
  ]);
  disableInput();
}
















  /* ========= UI HELPERS ========= */
  const scroll = () => chat.scrollTop = chat.scrollHeight;

  const bot = t => {
    const d = document.createElement("div");
    d.className = "eg-msg eg-bot";
    d.textContent = t;
    chat.appendChild(d);
    scroll();
  };

  const user = t => {
    const d = document.createElement("div");
    d.className = "eg-msg eg-user";
    d.textContent = t;
    chat.appendChild(d);
    scroll();
  };

  function actions(buttons){
    const wrap = document.createElement("div");
    wrap.className = "eg-actions";
    buttons.forEach(b=>{
      const btn = document.createElement("button");
      btn.className = b.primary ? "eg-primary" : "eg-chip";
      btn.textContent = b.label;
      btn.dataset.value = b.value;
      wrap.appendChild(btn);
    });
    chat.appendChild(wrap);
    scroll();
  }

  function enableInput(ph){
    input.disabled = false;
    sendBtn.disabled = false;
    input.placeholder = ph || "";
    input.value = "";
    input.focus();
  }

  function disableInput(){
    input.disabled = true;
    sendBtn.disabled = true;
  }

  /* ========= START ========= */
  chat.innerHTML = "";
  bot("Hi — I’m Element Ballpark Genie.");
  bot("Choose an estimator to begin:");
  actions([
    {label:"Design Ballpark", value:"design", primary:true},
    {label:"Build Ballpark", value:"build"}
  ]);
  disableInput();

  /* ========= CLICK ========= */
  chat.addEventListener("click", e=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const v = btn.dataset.value;

    /* START */
    if(step === "start"){
      flowType = v;
      user(btn.textContent);

      if(v === "design"){
        step = "design_sqft";
        bot("What is your estimated project square footage?");
        enableInput("Enter sq ft…");
      }

      if(v === "build"){
        step = "areas";
        bot("Which area(s) are included? Select all, then press Send.");
        actions([
          {label:"Driveway", value:"Driveway"},
          {label:"Front yard", value:"Front yard"},
          {label:"Side yard", value:"Side yard"},
          {label:"Backyard", value:"Backyard"}
        ]);
        sendBtn.disabled = false;
      }
      return;
    }

    /* AREAS */
    if(step === "areas"){
      btn.classList.toggle("selected");
      areas.has(v) ? areas.delete(v) : areas.add(v);
      return;
    }

    /* MATERIAL */
    if(step === "material"){
      material = v;
      user(v);

      if(v === "Concrete" || v === "Both"){
        step = "concrete_sqft";
        bot("Concrete square footage?");
        enableInput("Enter sq ft…");
      } else {
        step = "paver_sqft";
        bot("Paver square footage?");
        enableInput("Enter sq ft…");
      }
      return;
    }

    /* PAVER TIER */
    if(step === "paver_tier"){
      paverTier = v;
      user(v);
      step = "walls";
      bot("Any walls in this project?");
      actions([
        {label:"Yes", value:"Yes", primary:true},
        {label:"No", value:"No"}
      ]);
      disableInput();
      return;
    }

    /* WALL YES/NO */
    if(step === "walls"){
      user(v);
      if(v === "Yes"){
        step = "wall_type";
        bot("What type of wall?");
        actions([
          {label:"Retaining", value:"retaining", primary:true},
          {label:"Freestanding", value:"freestanding"},
          {label:"Both", value:"both"}
        ]);
      } else {
        step = "steps";
        bot("Any steps in this project?");
        actions([
          {label:"Yes", value:"Yes", primary:true},
          {label:"No", value:"No"}
        ]);
      }
      return;
    }

    /* WALL TYPE */
    if(step === "wall_type"){
      user(v);
      wallQueue = v === "both" ? ["retaining","freestanding"] : [v];
      currentWall = wallQueue.shift();
      step = "wall_len";
      bot(`${currentWall} wall linear feet?`);
      enableInput("Enter LF…");
      return;
    }

    /* WALL MATERIAL */
    if(step === "wall_mat"){
      user(v);
      if(v === "cmu"){
        step = "wall_finish";
        bot("Wall finish?");
        actions([
          {label:"None", value:"None", primary:true},
          {label:"Stucco", value:"Stucco"},
          {label:"Stone veneer", value:"Stone"}
        ]);
      } else {
        nextWall();
      }
      return;
    }

    /* WALL FINISH */
    if(step === "wall_finish"){
      user(v);
      nextWall();
      return;
    }

    /* STEPS */
    if(step === "steps"){
      user(v);
      if(v === "Yes"){
        step = "steps_lf";
        bot("Total linear feet of steps?");
        enableInput("Enter LF…");
      } else {
        step = "features";
        bot("Any special features? Select all, then press Send.");
        actions([
          {label:"Outdoor kitchen", value:"Outdoor kitchen"},
          {label:"Pergola", value:"Pergola"},
          {label:"Fire pit", value:"Fire pit"},
          {label:"Fireplace", value:"Fireplace"},
          {label:"Pool", value:"Pool"},
          {label:"Other", value:"Other"}
        ]);
        sendBtn.disabled = false;
      }
      return;
    }

    /* FEATURES */
    if(step === "features"){
      btn.classList.toggle("selected");
      features.has(v) ? features.delete(v) : features.add(v);
    }
  });





function showBuildRange(){
  let base = 0;

  if(material === "Concrete" || material === "Both"){
    base += concreteSqft * PRICING.concrete;
  }

  if((material === "Pavers" || material === "Both") && paverTier){
    base += paverSqft * PRICING.pavers[paverTier];
  }

  if(!base || base <= 0){
    bot("Thanks! We’ve captured your project details.");
    return;
  }

  const low = Math.round(base * (1 - RANGE_PERCENT));
  const high = Math.round(base * (1 + RANGE_PERCENT));

  bot(`Estimated build range: $${low.toLocaleString()} – $${high.toLocaleString()}`);
  bot(
    "Ballpark estimate only. This does not include special features, demolition, difficult access, or final material selections. A site visit is required to confirm pricing."
  );
}







  /* ========= SEND ========= */
  function send(){
    const v = input.value.trim();

    /* DESIGN */
    if(step === "design_sqft"){
      designSqft = Number(v);
      user(v);

      if(designSqft <= 1000) bot("Conceptual Design Package: $2,500");
      else if(designSqft <= 2500) bot("Conceptual Design Package: $3,000");
      else bot("Large-scale project — consultation required.");

      bot("This estimate is for reference purposes only. To move forward, please share your information and we’ll set up a free consultation.");
      step = "lead_first";
      bot("First name?");
      enableInput("Enter first name");
      return;
    }

    /* AREAS SUBMIT */
    if(step === "areas"){
      if(!areas.size){ bot("Please select at least one area."); return; }
      user([...areas].join(", "));
      step = "material";
      bot("What type of hardscape material?");
      actions([
        {label:"Concrete", value:"Concrete", primary:true},
        {label:"Pavers", value:"Pavers"},
        {label:"Both", value:"Both"}
      ]);
      disableInput();
      return;
    }

    /* CONCRETE */
    if(step === "concrete_sqft"){
      concreteSqft = Number(v);
      user(v);
      if(material === "Both"){
        step = "paver_sqft";
        bot("Paver square footage?");
        enableInput("Enter sq ft…");
      } else {
        step = "walls";
        bot("Any walls in this project?");
        actions([{label:"Yes",value:"Yes",primary:true},{label:"No",value:"No"}]);
        disableInput();
      }
      return;
    }

    /* PAVERS */
    if(step === "paver_sqft"){
      paverSqft = Number(v);
      user(v);
      step = "paver_tier";
      bot("Select paver tier:");
      actions([
        {label:"Basic", value:"Basic", primary:true},
        {label:"Mid", value:"Mid"},
        {label:"Premium", value:"Premium"}
      ]);
      disableInput();
      return;
    }

    /* WALL LENGTH */
    if(step === "wall_len"){
      user(v);
      step = "wall_ht";
      bot(`${currentWall} wall height (ft)?`);
      enableInput("Enter height…");
      return;
    }

    /* WALL HEIGHT */
    if(step === "wall_ht"){
      user(v);
      step = "wall_mat";
      bot(`${currentWall} wall material?`);
      actions([
        {label:"Modular block", value:"modular", primary:true},
        {label:"CMU / Cinder block", value:"cmu"}
      ]);
      disableInput();
      return;
    }

    /* STEPS LF */
    if(step === "steps_lf"){
      stepsLf = Number(v);
      user(v);
      step = "features";
      bot("Any special features? Select all, then press Send.");
      actions([
        {label:"Outdoor kitchen", value:"Outdoor kitchen"},
        {label:"Pergola", value:"Pergola"},
        {label:"Fire pit", value:"Fire pit"},
        {label:"Fireplace", value:"Fireplace"},
        {label:"Pool", value:"Pool"},
        {label:"Other", value:"Other"}
      ]);
      sendBtn.disabled = false;
      return;
    }

    /* FEATURES SUBMIT */
if(step === "features"){
  user(features.size ? [...features].join(", ") : "No special features");

  // 👉 SHOW RANGE HERE
  showBuildRange();

  bot("To continue, please share your information and we’ll set up a free consultation.");
  step = "lead_first";
  bot("First name?");
  enableInput("Enter first name");
  return;
}

    /* LEAD CAPTURE */
    if(step === "lead_first"){
      lead.first = v;
      user(v);
      step = "lead_last";
      bot("Last name?");
      enableInput("Enter last name");
      return;
    }

    if(step === "lead_last"){
      lead.last = v;
      user(v);
      step = "lead_phone";
      bot("Phone number?");
      enableInput("e.g. 555-123-4567");
      return;
    }

    if(step === "lead_phone"){
      if(!/^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(v)){
        bot("Please enter a valid phone number.");
        return;
      }
      lead.phone = v;
      user(v);
      step = "lead_email";
      bot("Email address?");
      enableInput("name@email.com");
      return;
    }

    if(step === "lead_email"){
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){
        bot("Please enter a valid email.");
        return;
      }
      lead.email = v;
      user(v);
      step = "lead_address";
      bot("Project address?");
      enableInput("Enter address");
      return;
    }

    if(step === "lead_address"){
  lead.address = v;
  user(v);

  // 📧 SEND EMAIL HERE (ONLY ONCE)
  sendEstimateEmail();

  bot("Thank you! Your information has been submitted.");
  bot("Restarting the estimator…");

  disableInput();

  setTimeout(() => {
    resetEstimator();
  }, 3000);

  return;
}









  }

  function nextWall(){
    if(wallQueue.length){
      currentWall = wallQueue.shift();
      step = "wall_len";
      bot(`${currentWall} wall linear feet?`);
      enableInput("Enter LF…");
    } else {
      step = "steps";
      bot("Any steps in this project?");
      actions([{label:"Yes",value:"Yes",primary:true},{label:"No",value:"No"}]);
    }
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e=>{
    if(e.key === "Enter"){ e.preventDefault(); send(); }
  });
})();
