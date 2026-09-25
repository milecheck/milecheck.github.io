// DRAFTS. Research September 24–25, 2026. Publication-day verification still required.
// Default export: eight page objects. Identity is (lang, slug), NOT slug alone.
// Existing generator fields are unchanged; lang is routing metadata for /fr/.
// Each bilingual section uses the same evidence. English audit comments remain in French output.
// Source comments record excerpt/full-page review, not a guarantee of a successful live fetch.
// See canada-handoff.md for retrieval limits and claims deliberately excluded.
const S = {
  entry: ['CBSA travel documents','https://www.cbsa-asfc.gc.ca/travel-voyage/td-dv-eng.html','Documents de voyage de l’ASFC','https://www.cbsa-asfc.gc.ca/travel-voyage/td-dv-fra.html'],
  usEntry: ['CBP Canadian visitor guidance','https://www.help.cbp.gov/s/article/Article-1418?language=en_US','Règles de CBP pour les visiteurs canadiens'],
  travelUS: ['Government of Canada US travel advice','https://travel.gc.ca/destinations/united-states','Conseils du gouvernement du Canada pour les États-Unis','https://voyage.gc.ca/destinations/etats-unis'],
  registration: ['USCIS registration requirements','https://www.uscis.gov/alienregistration','Exigences d’inscription de l’USCIS'],
  consent: ['Government of Canada consent-letter guidance','https://travel.gc.ca/travelling/children/consent-letter','Lettre de consentement pour un enfant','https://voyage.gc.ca/voyager/enfant/lettre-de-consentement'],
  pets: ['CFIA travel guidance','https://inspection.canada.ca/en/travelling-pets-food-plants','Agence canadienne d’inspection des aliments','https://inspection.canada.ca/fr/voyage-animaux-aliments-ou-vegetaux'],
  dog: ['CDC dog-entry requirements','https://www.cdc.gov/importation/dogs/rabies-free-low-risk-countries.html','Exigences des CDC pour les chiens'],
  geico: ['GEICO Canada insurance guidance','https://www.geico.com/living/information-regarding-geico-insurance-and-canada/','Assurance au Canada selon GEICO'],
  insurance: ['CAA-Québec insurance guidance','https://www.caaquebec.com/fr/conseils/preparer-un-voyage/location-d-auto-et-assurances-ce-qu-il-faut-savoir','Conseils de CAA-Québec sur l’assurance'],
  declaration: ['CBSA declaration guidance','https://www.cbsa-asfc.gc.ca/publications/forms-formulaires/e311-eng.html','Déclaration à l’Agence des services frontaliers du Canada','https://www.cbsa-asfc.gc.ca/publications/forms-formulaires/e311-fra.html'],
  visitorGoods: ['CBSA visitor allowances','https://www.cbsa-asfc.gc.ca/travel-voyage/bring-apporter-eng.html','Ce que les visiteurs peuvent apporter au Canada','https://cbsa-asfc.gc.ca/travel-voyage/bring-apporter-fra.html'],
  returning: ['CBSA returning-resident guide','https://www.cbsa-asfc.gc.ca/travel-voyage/declare-eng.html','Guide de l’ASFC pour les résidents qui reviennent au Canada','https://www.cbsa-asfc.gc.ca/travel-voyage/declare-fra.html'],
  cannabis: ['CBSA cannabis rules','https://www.cbsa-asfc.gc.ca/travel-voyage/cannabis-eng.html','Le cannabis à la frontière','https://www.cbsa-asfc.gc.ca/travel-voyage/cannabis-fra.html'],
  dui: ['IRCC inadmissibility guidance','https://www.canada.ca/en/immigration-refugees-citizenship/services/admissibility-enforcement/inadmissibility.html','Interdiction de territoire selon IRCC','https://www.canada.ca/fr/immigration-refugies-citoyennete/services/admissibilite-application-loi/interdit-territoire.html'],
  bc: ['BC signed winter routes','https://www2.gov.bc.ca/gov/content/transportation/driving-and-cycling/traveller-information/seasonal/winter-driving/winter-tire-and-chain-up-routes?keyword=2021','Routes hivernales désignées en Colombie-Britannique'],
  qc: ['Quebec winter-tire requirements','https://www.quebec.ca/en/transports/traffic-road-safety/winter-road-safety/requirements-for-winter-tires','Obligations liées aux pneus d’hiver','https://www.quebec.ca/transports/circulation-securite-routiere/periode-hivernale/pneus-hiver'],
  radar: ['SAAQ road guide (French)','https://saaq.gouv.qc.ca/blob/saaq/documents/publications/guide-route.pdf','Guide de la route de la SAAQ','https://saaq.gouv.qc.ca/blob/saaq/documents/publications/guide-route.pdf'],
  usDeclaration: ['CBP declaration form','https://www.cbp.gov/sites/default/files/2024-07/cbp_form_6059b_english.pdf','Déclaration de CBP'],
  usAlcohol: ['19 CFR 148.43','https://www.ecfr.gov/current/title-19/chapter-I/part-148/subpart-E/section-148.43','19 CFR 148.43'],
  usGifts: ['19 CFR 148.44','https://www.ecfr.gov/current/title-19/chapter-I/part-148/subpart-E/section-148.44','19 CFR 148.44'],
  driving: ['USA.gov visitor-driving guidance','https://www.usa.gov/non-citizen-driving','Conduite aux États-Unis selon USA.gov'],
  verizon: ['Verizon TravelPass','https://www.verizon.com/plans/international/international-travel/travel-pass/','Verizon TravelPass'],
  attPlans: ['AT&T Canada inclusion','https://www.att.com/international/pay-per-use-rates/','Couverture du Canada chez AT&T'],
  attPass: ['AT&T International Day Pass','https://www.att.com/support/article/wireless/KM1175103/','AT&T International Day Pass'],
  tmPlans: ['T-Mobile Canada and Mexico benefit','https://www.t-mobile.com/support/coverage/canada-mexico-included','Couverture du Canada et du Mexique chez T-Mobile'],
  tmPass: ['T-Mobile International Pass','https://www.t-mobile.com/cell-phone-plans/international-roaming-plans/unlimited-calling-data-pass','T-Mobile International Pass'],
  rogers: ['Rogers roaming options','https://www.rogers.com/mobility/roaming','Options d’itinérance de Rogers'],
  bell: ['Bell Roam Better','https://www.bell.ca/Mobility/Roam-Better','Bell Roam Better'],
  bellFAQ: ['Bell roaming FAQ','https://www.bell.ca/Mobility/Roam-Better-FAQ','Questions sur l’itinérance chez Bell'],
  telus: ['TELUS Easy Roam','https://www.telus.com/en/mobility/travel','TELUS Easy Roam'],
  freedom: ['Freedom roaming terms','https://www.freedommobile.ca/en-CA/network-coverage/international-roaming','Conditions d’itinérance de Freedom'],
  maps: ['Google Maps offline help','https://support.google.com/maps/answer/6291838?hl=en','Aide Google Maps hors connexion','https://support.google.com/maps/answer/6291838?hl=fr'],
  crtc: ['CRTC wireless 911 guidance','https://crtc.gc.ca/eng/phone/911/can.htm','Services 9-1-1 du CRTC','https://crtc.gc.ca/fra/phone/911/can.htm'],
  us911: ['National 911 Program','https://www.911.gov/calling-911/frequently-asked-questions/','Programme national américain du 911'],
};
const dateFor = key => ['bc','tmPass','bellFAQ','crtc','us911','dui'].includes(key) ? '2026-09-25' : '2026-09-24';
const a = (url, text) => `<a href="${url}">${text}</a>`;
const local = (path, text) => a(`https://milecheckapp.com/${path}`, text);
const pageLink = (lang, slug, text) => local(`${lang === 'fr' ? 'fr/' : ''}${slug}/`, text);
const provinces = [
  ['british-columbia','British Columbia','Colombie-Britannique'],['alberta','Alberta','Alberta'],
  ['ontario','Ontario','Ontario'],['quebec','Quebec','Québec'],
  ['nova-scotia','Nova Scotia','Nouvelle-Écosse'],['northwest-territories','Northwest Territories','Territoires du Nord-Ouest'],
];
function provinceLinks(lang) {
  return provinces.map(([slug,en,fr]) => local(`blog/km-markers-${slug}.html`, lang === 'fr' ? fr : en)).join(' · ');
}
function section(lang, headings, bodies, keys = []) {
  const index = lang === 'fr' ? 1 : 0;
  const refs = keys.map(k => {
    const s = S[k];
    return a(index && s[3] ? s[3] : s[1], index ? s[2] + (!s[3] && !s[1].includes('/fr/') ? ' (en anglais)' : '') : s[0]);
  });
  const audit = keys.length ? `<!-- Source review: ${keys.map(k => `${dateFor(k)} ${S[k][1]}`).join(' | ')} -->\n` : '<!-- Editorial planning advice; no numeric or legal claim. -->\n';
  return [headings[index], audit + bodies[index] + (headings[0] === 'Download the route before leaving' ? routeLinks(lang) + `<p>${provinceLinks(lang)}.</p><p>${local('corridors/i-5/', lang === 'fr' ? 'I-5 à Blaine (en anglais)' : 'I-5 at Blaine')} · ${local('borders/', lang === 'fr' ? 'Temps d’attente au poste frontalier' : 'Border wait times')}.</p>` : '') + (refs.length ? `<p>${refs.join(' · ')}.</p>` : '')];
}
function routeLinks(lang) {
  const fr = lang === 'fr';
  return '<p>' + [
    pageLink(lang,'drive-into-canada',fr ? 'Entrer au Canada' : 'Driving into Canada'),
    pageLink(lang,'drive-into-us-from-canada',fr ? 'Entrer aux États-Unis' : 'Driving into the US'),
    pageLink(lang,'will-my-phone-work-in-canada',fr ? 'Cellulaire au Canada' : 'Phone use in Canada'),
    pageLink(lang,'will-my-phone-work-in-the-us',fr ? 'Cellulaire aux États-Unis' : 'Phone use in the US'),
    local('canada/',fr ? 'Guide du Canada (en anglais)' : 'Canada hub'),
    pageLink(lang,'driving-in-the-us-foreign-visitor-guide',fr ? 'Conduire aux États-Unis' : 'US visitor-driving guide'),
    local('what-is-my-mile-marker/',fr ? 'Bornes en milles (en anglais)' : 'Find your mile marker'),
    local('rental-car-canada-mexico/',fr ? 'Location et frontière (en anglais)' : 'Cross-border rental rules'),
  ].join(' · ') + '</p>';
}
function related(lang) {
  const fr = lang === 'fr';
  return routeLinks(lang) + `<p>${local('borders/',fr ? 'Temps d’attente aux postes frontaliers' : 'Border wait times')} · ${local('report-location/',fr ? 'Décrire votre emplacement' : 'Report your location')}.</p><p>${fr ? 'Guides des bornes kilométriques' : 'Kilometre-marker guides'}. ${provinceLinks(lang)}.</p><p>${local('blog/mile-markers-new-york.html',fr ? 'Bornes en milles de l’État de New York' : 'New York mile markers')} · ${local('cameras/new-york/',fr ? 'Caméras de l’État de New York' : 'New York cameras')} · ${local('blog/mile-markers-washington.html',fr ? 'Bornes en milles de l’État de Washington' : 'Washington mile markers')} · ${local('cameras/washington/',fr ? 'Caméras de l’État de Washington' : 'Washington cameras')}.</p>`;
}

// Written first for the Quebec reader. Citizenship-specific advice is not extended to all Canadian residents.
function intoUS(lang) {
  const fr = lang === 'fr';
  return {
    lang, checked:lang==='fr'?'septembre 2026':'September 2026', slug:'drive-into-us-from-canada', eyebrow:fr ? 'Conduire à l’étranger' : 'Driving abroad',
    title:fr ? 'Aller aux États-Unis en auto depuis le Canada' : 'Driving into the US from Canada in your own car',
    h1:fr ? 'Que faut-il pour aller aux États-Unis en auto?' : 'What do you need to drive into the US from Canada?',
    // Reviewed 2026-09-24: CBP Article-1418; travel.gc.ca/destinations/united-states; USCIS alienregistration (indexed).
    lede:fr ? 'Préparez vos documents de voyage et ceux de l’auto avant de traverser la frontière. Un citoyen canadien peut généralement visiter les États-Unis jusqu’à six mois, mais CBP décide de la durée autorisée. Pour un séjour de 30 jours ou plus, vérifiez aussi les exigences d’inscription.' : 'Prepare your travel documents and the car’s paperwork before crossing. Canadian citizens can generally visit for up to six months, but CBP decides the permitted stay. For 30 days or more, also check the registration requirement.',
    sections:[
      section(lang,['Documents for the people in the car','Les documents des personnes dans l’auto'],[
        '<p>For a Canadian citizen driving across, bring a valid passport or an accepted land-border document such as NEXUS. A regular provincial driver’s licence is not a passport substitute. Canadian permanent residence alone does not confer the same entry rules as Canadian citizenship.</p><p>US citizens, including dual citizens, should use their US travel documents. Check the specific rules for every passenger.</p>',
        '<p>Si vous êtes citoyen canadien, apportez un passeport valide ou un document accepté à la frontière terrestre, comme une carte NEXUS. Un permis de conduire provincial ordinaire ne remplace pas le passeport. La résidence permanente au Canada ne donne pas les mêmes droits d’entrée que la citoyenneté canadienne.</p><p>Les citoyens américains, y compris les personnes ayant la double citoyenneté, doivent utiliser leurs documents de voyage américains. Vérifiez les règles pour chaque passager.</p>'
      ],['usEntry','travelUS']),
      section(lang,['Six months is not an automatic entitlement','Six mois ne sont pas garantis'],[
        '<p>Tell CBP your intended departure date. Check the admission record and follow the authorised period, even if it is shorter than six months.</p><p>If you will remain for 30 days or longer, check whether an I-94 already records your registration. Canadian land arrivals without evidence of registration can need to register with USCIS before the 30 days expire. Follow its age-specific instructions for children. Registration does not extend admission or authorise work.</p>',
        '<p>Indiquez à CBP la date prévue de votre départ. Vérifiez votre dossier d’admission et respectez la période autorisée, même si elle est inférieure à six mois.</p><p>Pour un séjour de 30 jours ou plus, vérifiez si un formulaire I-94 confirme déjà votre inscription. Un Canadien arrivé par voie terrestre sans preuve d’inscription peut devoir s’inscrire auprès de l’USCIS avant la fin des 30 jours. Suivez ses consignes selon l’âge pour les enfants. Cette inscription ne prolonge pas le séjour et n’autorise pas à travailler.</p>'
      ],['usEntry','registration']),
      section(lang,['Registration and insurance for the car','L’immatriculation et l’assurance de l’auto'],[
        `<p>Carry your licence, vehicle registration and insurance proof. Ask your insurer to confirm US coverage for the drivers, trip length and liability limits. Do not assume that the border accepting your documents proves every loss is insured.</p><p>For a borrowed or leased car, ask the owner or lessor for written cross-border permission. For a rental, check ${pageLink(lang,'rental-car-canada-mexico','the company’s cross-border policy')}.</p>`,
        `<p>Apportez votre permis de conduire, le certificat d’immatriculation et la preuve d’assurance. Faites confirmer par votre assureur la couverture aux États-Unis pour les conducteurs, la durée du voyage et les montants de responsabilité civile. L’acceptation des documents à la frontière ne confirme pas toutes vos protections.</p><p>Pour une auto empruntée ou louée à long terme, demandez au propriétaire ou au locateur une autorisation écrite de traverser la frontière. Pour une auto de location, consultez ${local('rental-car-canada-mexico/','les règles de la compagnie (en anglais)')}.</p>`
      ],['insurance']),
      section(lang,['Declare what is in the car','Déclarez ce qui se trouve dans l’auto'],[
        '<p>Declare food, plants and animal products. Do not assume a sandwich or fruit bought in Canada is exempt from inspection. Declare more than US$10,000 in currency or monetary instruments, including the combined amount for a family travelling together.</p><p>Leave cannabis at home. Canadian legality does not permit taking it across the border. For an ordinary trip, leave firearms home too. A hunting trip needs its own advance import checks, not a blanket assumption that every firearm is either allowed or banned.</p>',
        '<p>Déclarez les aliments, les plantes et les produits d’origine animale. Un sandwich ou un fruit acheté au Canada n’est pas automatiquement exempté d’inspection. Déclarez les devises et instruments monétaires dont le total dépasse 10 000 $ US, y compris le montant combiné d’une famille qui voyage ensemble.</p><p>Laissez le cannabis à la maison. Sa légalité au Canada ne permet pas de traverser la frontière avec. Pour un voyage ordinaire, laissez aussi les armes à feu à la maison. Un voyage de chasse exige de vérifier les règles d’importation à l’avance.</p>'
      ],['usDeclaration','cannabis']),
      section(lang,['Visitor allowances are not returning-resident allowances','Les exemptions du visiteur sont différentes'],[
        '<p>For an eligible adult nonresident’s personal use, the federal duty exemption covers up to 1 litre of alcohol and 200 cigarettes or 50 cigars or 2 kilograms of smoking tobacco. Age and state restrictions still apply.</p><p>A separate US$100 gift exemption requires an intended stay of at least 72 hours and no use of that exemption in the preceding six months. Alcohol and cigarettes do not qualify. Declare the goods even when you expect an exemption.</p>',
        '<p>Pour l’usage personnel d’un visiteur adulte admissible, l’exemption fédérale couvre jusqu’à 1 litre d’alcool et 200 cigarettes ou 50 cigares ou 2 kilogrammes de tabac à fumer. Les restrictions d’âge et celles de l’État s’appliquent aussi.</p><p>L’exemption distincte de 100 $ US pour les cadeaux exige un séjour prévu d’au moins 72 heures. Vous ne devez pas l’avoir utilisée dans les six mois précédents. L’alcool et les cigarettes en sont exclus. Déclarez les biens même si vous pensez avoir droit à une exemption.</p>'
      ],['usAlcohol','usGifts']),
      section(lang,['Children and pets need their own checks','Les enfants et les animaux ont leurs propres exigences'],[
        '<p>Carry a consent letter when a child travels without one or both parents or legal guardians, plus relevant custody documents. Check the child’s citizenship and land-entry document rules separately.</p><p>Before bringing a dog, use the CDC entry guidance for its travel history. A Canadian vaccination record alone is not a complete US entry checklist.</p>',
        '<p>Apportez une lettre de consentement lorsqu’un enfant voyage sans l’un de ses parents ou tuteurs, ainsi que les documents de garde pertinents. Vérifiez séparément les documents d’entrée terrestre selon sa citoyenneté.</p><p>Avant d’amener un chien, consultez les exigences des CDC selon les pays où il a séjourné. Un carnet de vaccination canadien ne constitue pas à lui seul une liste complète des documents exigés.</p>'
      ],['consent','dog']),
      section(lang,['Change your units before driving away','Changez les unités avant de reprendre la route'],[
        `<p>US speed signs generally use miles per hour. Set your display to mph so you can read the posted limit directly. Carry your valid Canadian licence and check the rules of the states you visit.</p><p>Read ${local('what-is-my-mile-marker/','how mile markers work')} and ${local('report-location/','how to report your location')}. Give the road number, direction and observed marker or exit. Check ${pageLink(lang,'will-my-phone-work-in-the-us','your phone’s US roaming plan')} before the crossing.</p>`,
        `<p>Les limites de vitesse américaines sont généralement en milles à l’heure. Réglez l’affichage sur mph pour lire directement la limite indiquée. Apportez votre permis canadien valide et vérifiez les règles des États visités.</p><p>Consultez ${local('what-is-my-mile-marker/','le guide des bornes en milles (en anglais)')} et ${local('report-location/','le guide pour décrire votre emplacement (en anglais)')}. Donnez le numéro de route, la direction et la borne ou la sortie observée. Vérifiez ${pageLink(lang,'will-my-phone-work-in-the-us','votre forfait cellulaire aux États-Unis')} avant le poste frontalier.</p>`
      ],['driving']),
      section(lang,['Coming home to Canada','Le retour au Canada'],[
        '<table><thead><tr><th>Time outside Canada</th><th>Personal exemption</th></tr></thead><tbody><tr><td>Less than 24 hours</td><td>None.</td></tr><tr><td>24 hours or more</td><td>CA$200. No alcohol or tobacco. Exceeding CA$200 loses this exemption.</td></tr><tr><td>48 hours or more</td><td>CA$800, with separate alcohol and tobacco limits.</td></tr><tr><td>7 days or more</td><td>CA$800. Some declared goods may follow later. Alcohol and tobacco must accompany you.</td></tr></tbody></table><p>These are alternatives, not amounts to add together. Declare purchases and gifts at their value in Canadian dollars.</p>',
        '<table><thead><tr><th>Durée de l’absence</th><th>Exemption personnelle</th></tr></thead><tbody><tr><td>Moins de 24 heures</td><td>Aucune.</td></tr><tr><td>24 heures ou plus</td><td>200 $ CA. Aucun alcool ni tabac. Si vous dépassez 200 $ CA, cette exemption ne s’applique pas.</td></tr><tr><td>48 heures ou plus</td><td>800 $ CA, avec des limites distinctes pour l’alcool et le tabac.</td></tr><tr><td>7 jours ou plus</td><td>800 $ CA. Certains biens déclarés peuvent suivre plus tard. L’alcool et le tabac doivent vous accompagner.</td></tr></tbody></table><p>Ces exemptions ne s’additionnent pas. Déclarez vos achats et cadeaux selon leur valeur en dollars canadiens.</p>'
      ],['returning']),
    ],
    // FAQ evidence: the dated CBP, USCIS, CBSA and travel-document sources used immediately above.
    faq: fr ? [
      ['Mon permis québécois suffit-il pour entrer?', 'Un permis ordinaire ne remplace pas un document de voyage accepté, comme un passeport valide ou une carte NEXUS.'],
      ['Ai-je automatiquement droit à six mois?', 'Non. Respectez la durée de séjour accordée par CBP.'],
      ['Faut-il vérifier l’inscription pour 30 jours?', 'Oui. Vérifiez si vous êtes déjà inscrit et suivez les exigences de l’USCIS qui s’appliquent à votre situation.'],
      ['Puis-je apporter du cannabis acheté légalement?', 'Ne traversez pas la frontière avec du cannabis sans l’autorisation fédérale requise.'],
      ['Une journée de magasinage donne-t-elle une exemption?', 'Pas si vous revenez au Canada après moins de 24 heures.'],
      ['Où consulter les temps d’attente?', 'Consultez la page des postes frontaliers ci-dessous et vérifiez le sens de circulation ainsi que le type de voie.'],
    ] : [
      ['Is a regular Canadian licence enough to enter?', 'It does not replace an accepted travel document such as a valid passport or NEXUS card.'],
      ['Are six months guaranteed?', 'No. Follow the period CBP authorises.'],
      ['Should you check registration for a 30-day stay?', 'Yes. Check whether you are already registered and follow the USCIS requirements for your circumstances.'],
      ['Can you bring legally purchased cannabis?', 'Do not cross with cannabis without the required federal authorisation.'],
      ['Does a shopping day qualify for a Canadian exemption?', 'Not when you return after less than 24 hours.'],
      ['Where do you check the border queue?', 'Use the border-wait page below and check the direction and lane type.'],
    ], related:related(lang),
  };
}

function intoCanada(lang) {
  const fr = lang === 'fr';
  return {
    lang, checked:lang==='fr'?'septembre 2026':'September 2026', slug:'drive-into-canada', eyebrow:fr ? 'Conduire à l’étranger' : 'Driving abroad',
    title:fr ? 'Entrer au Canada avec votre auto depuis les États-Unis' : 'Driving into Canada in your own car',
    h1:fr ? 'Que faut-il pour entrer au Canada avec votre auto?' : 'What do you need to drive into Canada in your own car?',
    // Reviewed 2026-09-24: CBSA travel documents, declaration form and GEICO Canada guidance.
    lede:fr ? 'Préparez un document de voyage accepté pour chaque personne et apportez l’immatriculation de l’auto ainsi qu’une preuve d’assurance valide au Canada. Déclarez ce que vous transportez. Ce guide vise une visite depuis les États-Unis, pas l’importation permanente d’un véhicule.' : 'Prepare an accepted travel document for everyone, plus the car’s registration and proof of insurance valid in Canada. Declare what you are carrying. This guide covers a visit from the US, not permanently importing a vehicle.',
    sections:[
      section(lang,['Check each traveller’s status','Vérifiez le statut de chaque personne'],[
        '<p>CBSA recommends a valid passport for US citizens. If you plan to use NEXUS, a US passport card or an enhanced licence at a land crossing, confirm that the exact document is accepted for both entry and the return trip. A regular licence is not an enhanced licence.</p><p>US permanent residents should carry a valid passport and official proof of US permanent residence. Other nationalities have their own requirements.</p>',
        '<p>L’Agence des services frontaliers du Canada recommande un passeport valide aux citoyens américains. Si vous comptez utiliser NEXUS, une carte-passeport américaine ou un permis amélioré à un poste terrestre, confirmez que ce document précis est accepté à l’aller et au retour. Un permis ordinaire n’est pas un permis amélioré.</p><p>Les résidents permanents des États-Unis devraient apporter un passeport valide et une preuve officielle de ce statut. Les exigences sont différentes pour les autres nationalités.</p>'
      ],['entry']),
      section(lang,['Children and pets','Les enfants et les animaux'],[
        '<p>Bring each child’s travel documents and relevant custody papers. A consent letter from an absent parent or legal guardian can help establish permission to travel.</p><p>Use the Canadian Food Inspection Agency’s pet guidance for the animal’s species, age and origin. Check the return requirements too, especially the CDC rules for dogs entering the US.</p>',
        '<p>Apportez les documents de voyage de chaque enfant et les documents de garde pertinents. Une lettre de consentement d’un parent ou tuteur absent peut aider à confirmer l’autorisation de voyager.</p><p>Consultez l’Agence canadienne d’inspection des aliments selon l’espèce, l’âge et la provenance de l’animal. Vérifiez aussi les exigences du retour, notamment celles des CDC pour les chiens qui entrent aux États-Unis.</p>'
      ],['consent','pets','dog']),
      section(lang,['Carry the car’s paperwork','Apportez les documents de l’auto'],[
        `<p>Carry the registration and insurance proof. Ask your insurer to confirm the trip is covered and whether it will issue a Canadian Non-Resident Inter-Province Motor Vehicle Liability Insurance Card. The special card is not required for every tourist. GEICO says its US insurance card is accepted for its customers visiting Canada.</p><p>Ask the owner or lessor for written cross-border permission if the car is not yours. For a rental, read ${local('rental-car-canada-mexico/','the company’s cross-border rules')}.</p>`,
        `<p>Apportez le certificat d’immatriculation et la preuve d’assurance. Demandez à votre assureur de confirmer la couverture du voyage et s’il délivre une carte canadienne d’assurance responsabilité automobile pour non-résident, appelée Canadian Non-Resident Inter-Province Motor Vehicle Liability Insurance Card. Cette carte particulière n’est pas obligatoire pour tous les touristes. GEICO indique que sa carte d’assurance américaine est acceptée pour ses clients en visite au Canada.</p><p>Si l’auto n’est pas à vous, demandez au propriétaire ou au locateur une autorisation écrite de traverser la frontière. Pour une location, consultez ${local('rental-car-canada-mexico/','les règles de la compagnie (en anglais)')}.</p>`
      ],['geico']),
      section(lang,['Declare food, purchases and money','Déclarez les aliments, les achats et l’argent'],[
        '<p>Declare food, plants, animals and animal products. The currency reporting threshold is CA$10,000 or more in total currency and monetary instruments, including foreign-currency equivalents. It is a declaration threshold, not a ban on carrying that amount.</p><p>Eligible visitors of the required age can bring 1.5 litres of wine or 1.14 litres of spirits or 8.5 litres of beer within the alcohol allowance. These are alternatives. Tobacco has separate quantity and duty rules. Check the visitor allowance before packing it.</p>',
        '<p>Déclarez les aliments, les plantes, les animaux et les produits d’origine animale. Le seuil de déclaration des devises et instruments monétaires est de 10 000 $ CA ou plus au total, y compris l’équivalent en devises étrangères. Ce montant doit être déclaré, mais il n’est pas interdit de le transporter.</p><p>Un visiteur admissible ayant l’âge requis peut apporter 1,5 litre de vin ou 1,14 litre de spiritueux ou 8,5 litres de bière dans les limites de l’exemption. Ces quantités ne s’additionnent pas. Le tabac a ses propres limites et droits. Vérifiez-les avant de faire vos bagages.</p>'
      ],['declaration','visitorGoods']),
      section(lang,['Leave cannabis home and resolve firearm questions first','Laissez le cannabis à la maison'],[
        '<p>Canada’s legal cannabis market does not permit bringing cannabis across its border. The restriction includes cannabis products and CBD products without the required federal permit or exemption.</p><p>Declare firearms and other weapons. For an ordinary visit, leave them home. If the purpose of the trip involves a firearm, resolve its import and possession requirements before departure. Declaring an item is not the same as having permission to bring it.</p>',
        '<p>La vente légale de cannabis au Canada ne permet pas d’en apporter à la frontière. Cette restriction comprend les produits du cannabis et les produits au CBD sans le permis ou l’exemption fédérale requis.</p><p>Déclarez les armes à feu et les autres armes. Pour une visite ordinaire, laissez-les à la maison. Si le voyage implique une arme à feu, vérifiez les exigences d’importation et de possession avant de partir. Une déclaration n’est pas une autorisation d’importer.</p>'
      ],['cannabis','declaration']),
      section(lang,['A past DUI can affect admission','Une condamnation pour conduite avec facultés affaiblies'],[
        '<p>A past impaired-driving offence can make you inadmissible to Canada. Do not assume a short visit or an old conviction removes the issue.</p><p>Consult Immigration, Refugees and Citizenship Canada before booking. A temporary resident permit or rehabilitation may be relevant, depending on the case. Neither is a promise of admission at the border.</p>',
        '<p>Une infraction passée de conduite avec facultés affaiblies peut vous rendre interdit de territoire au Canada. Ne supposez pas qu’une courte visite ou l’ancienneté de la condamnation règle la question.</p><p>Consultez Immigration, Réfugiés et Citoyenneté Canada avant de réserver. Un permis de séjour temporaire ou une démarche de réadaptation peut être pertinent selon le dossier. Aucun ne constitue une promesse d’admission au poste frontalier.</p>'
      ],['dui']),
      section(lang,['Kilometres and winter equipment','Les kilomètres et l’équipement d’hiver'],[
        `<p>Read Canadian speed limits in km/h. Review the kilometre-marker guide for your route rather than treating a number as a US mile marker.</p><p>BC’s signed winter routes generally run from October 1 through April 30, with some ending March 31. Quebec’s December 1–March 15 winter-tire requirement applies to Quebec-registered vehicles, with stated exceptions. Its visitor guidance excludes vehicles registered outside Quebec. Equip the car for the conditions regardless.</p><p>${provinceLinks(lang)}.</p>`,
        `<p>Au Canada, les limites de vitesse sont en km/h. Consultez le guide des bornes kilométriques de votre itinéraire au lieu de lire les distances comme des milles américains.</p><p>En Colombie-Britannique, les exigences des routes hivernales désignées s’appliquent généralement du 1er octobre au 30 avril. Certaines prennent fin le 31 mars. Au Québec, l’obligation du 1er décembre au 15 mars vise les véhicules immatriculés au Québec, avec des exceptions. Le gouvernement exclut les véhicules immatriculés ailleurs. Équipez tout de même l’auto selon les conditions.</p><p>${provinceLinks(lang)}.</p>`
      ],['geico','bc','qc']),
      section(lang,['Before you leave the border','Avant de quitter le poste frontalier'],[
        `<p>Quebec prohibits driving a vehicle equipped with a radar detector. Check provincial rules before packing one. Set up ${pageLink(lang,'will-my-phone-work-in-canada','your phone’s Canada coverage')} before driving away.</p><p>For the return, read ${pageLink(lang,'drive-into-us-from-canada','the US crossing guide')}, but use CBP’s returning-resident rules if you live in the US. A Canadian visitor’s allowance is not your US resident allowance. Keep receipts and declare your purchases.</p>`,
        `<p>Au Québec, il est interdit de conduire un véhicule muni d’un détecteur de radar. Vérifiez les règles provinciales avant d’en apporter un. Préparez ${pageLink(lang,'will-my-phone-work-in-canada','votre couverture cellulaire au Canada')} avant de reprendre la route.</p><p>Pour le retour, consultez ${pageLink(lang,'drive-into-us-from-canada','le guide pour entrer aux États-Unis')}, mais utilisez les exemptions de CBP pour les résidents si vous habitez aux États-Unis. Celles d’un visiteur canadien ne sont pas les mêmes. Gardez vos reçus et déclarez vos achats.</p>`
      ],['radar']),
    ],
    // FAQ evidence: the same dated sources as the sections above. No unverified special-card mandate.
    faq:fr ? [
      ['Faut-il un passeport pour chaque personne?', 'Vérifiez les documents acceptés selon la citoyenneté et le mode d’entrée. L’ASFC recommande un passeport valide aux citoyens américains.'],
      ['La carte d’assurance canadienne spéciale est-elle toujours obligatoire?', 'Non. Demandez à votre assureur quelle preuve apporter. GEICO indique que sa carte américaine est acceptée pour ses clients en visite au Canada.'],
      ['Dois-je déclarer exactement 10 000 $ CA?', 'Oui. Le seuil canadien est de 10 000 $ CA ou plus en devises et instruments monétaires.'],
      ['Puis-je apporter du cannabis légal?', 'Pas sans le permis ou l’exemption fédérale requis pour traverser la frontière.'],
      ['Les règles hivernales de la Colombie-Britannique finissent-elles toutes en mars?', 'Non. Certaines routes désignées restent visées jusqu’au 30 avril.'],
      ['Un détecteur de radar est-il permis au Québec?', 'Il est interdit d’y conduire un véhicule muni d’un détecteur de radar.'],
    ] : [
      ['Does everyone need a passport?', 'Check accepted documents for each citizenship and entry method. CBSA recommends a valid passport for US citizens.'],
      ['Is the special Canadian insurance card always required?', 'No. Ask your insurer what proof to carry. GEICO says its US card is accepted for its customers visiting Canada.'],
      ['Must you declare exactly CA$10,000?', 'Yes. Canada’s threshold is CA$10,000 or more in currency and monetary instruments.'],
      ['Can you bring legal cannabis?', 'Not without the required federal permit or exemption for crossing the border.'],
      ['Do all BC winter-route rules end in March?', 'No. Some designated routes remain covered through April 30.'],
      ['Can you use a radar detector in Quebec?', 'Quebec prohibits driving a vehicle equipped with one.'],
    ], related:related(lang),
  };
}

function phone(lang, destination) {
  const fr = lang === 'fr';
  const canada = destination === 'canada';
  const slug = canada ? 'will-my-phone-work-in-canada' : 'will-my-phone-work-in-the-us';
  const title = canada
    ? (fr ? 'Votre cellulaire américain fonctionnera-t-il au Canada?' : 'Will your US phone work in Canada?')
    : (fr ? 'Votre cellulaire fonctionnera-t-il aux États-Unis?' : 'Will your Canadian phone work in the US?');
  const planBody = canada ? [
    '<p>Prices reviewed September 24–25, 2026, in US dollars. Check the exact line in your account.</p><table><thead><tr><th>Carrier</th><th>Included Canada coverage</th><th>Paid option</th></tr></thead><tbody><tr><td>Verizon</td><td>Its page includes Canada with Simplicity and Unlimited plans.</td><td>Eligible other plans can use TravelPass at US$6 per line per day, plus taxes and fees. After 5 GB in a session, data drops to 3G speeds for the rest of that session.</td></tr><tr><td>AT&amp;T</td><td>AT&amp;T says every Unlimited plan includes Canada talk, text and data.</td><td>Where eligible and needed, International Day Pass is US$12 for the first line per 24-hour period. Confirm Canada is not already included.</td></tr><tr><td>T-Mobile</td><td>Qualifying plans include Experience More and several Go5G, Magenta and ONE plans. Data allowances and reduced speeds vary.</td><td>Its current 1 Day International Pass is US$10 for 2 GB and calling for up to 24 hours, on a qualifying plan.</td></tr></tbody></table>',
    '<p>Prix consultés les 24 et 25 septembre 2026, en dollars américains. Vérifiez la ligne précise dans votre compte.</p><table><thead><tr><th>Fournisseur</th><th>Couverture incluse au Canada</th><th>Option payante</th></tr></thead><tbody><tr><td>Verizon</td><td>Sa page inclut le Canada dans les forfaits Simplicity et Unlimited.</td><td>Les autres forfaits admissibles peuvent utiliser TravelPass à 6 $ US par ligne et par jour, plus taxes et frais. Après 5 Go par période, le débit passe à la vitesse 3G jusqu’à la fin de cette période.</td></tr><tr><td>AT&amp;T</td><td>AT&amp;T indique que tous ses forfaits Unlimited incluent les appels, textos et données au Canada.</td><td>Si elle est nécessaire et admissible, l’option International Day Pass coûte 12 $ US pour la première ligne par période de 24 heures. Vérifiez d’abord si le Canada est déjà inclus.</td></tr><tr><td>T-Mobile</td><td>Les forfaits admissibles comprennent Experience More et plusieurs forfaits Go5G, Magenta et ONE. Les données et débits réduits varient.</td><td>Le laissez-passer actuel 1 Day International Pass coûte 10 $ US pour 2 Go et les appels pendant un maximum de 24 heures, avec un forfait admissible.</td></tr></tbody></table>'
  ] : [
    '<p>Prices reviewed September 24, 2026, in Canadian dollars. These are the daily options, not quotes for every account.</p><table><thead><tr><th>Carrier</th><th>Published US option</th><th>Check first</th></tr></thead><tbody><tr><td>Rogers</td><td>US daily roaming, CA$16 per day.</td><td>Whether your plan already includes the US or a trip pass costs less.</td></tr><tr><td>Bell</td><td>Roam Better, CA$13 per day, ending at 11:59 p.m. Eastern.</td><td>Whether you have a Canada/US plan. Roam Better can reduce speed after 5 GB per day.</td></tr><tr><td>TELUS</td><td>Easy Roam US, CA$16 per day.</td><td>Whether US use is included. TELUS also sells multi-day US passes. Check its site for current prices.</td></tr><tr><td>Freedom</td><td>US use is included on qualifying plans. Check the rate for your specific plan.</td><td>Your plan’s country list and data allowance. Do not assume an older plan has current inclusions.</td></tr></tbody></table>',
    '<p>Prix consultés le 24 septembre 2026, en dollars canadiens. Ce sont les options quotidiennes publiées, pas une estimation pour chaque compte.</p><table><thead><tr><th>Fournisseur</th><th>Option américaine publiée</th><th>À vérifier d’abord</th></tr></thead><tbody><tr><td>Rogers</td><td>Itinérance quotidienne aux États-Unis, 16 $ CA par jour.</td><td>Si les États-Unis sont déjà inclus ou si un laissez-passer coûte moins cher.</td></tr><tr><td>Bell</td><td>Roam Better, 13 $ CA par jour, jusqu’à 23 h 59, heure de l’Est.</td><td>Si votre forfait couvre le Canada et les États-Unis. Roam Better peut réduire le débit après 5 Go par jour.</td></tr><tr><td>TELUS</td><td>Easy Roam aux États-Unis, 16 $ CA par jour.</td><td>Si les États-Unis sont inclus. TELUS vend aussi des laissez-passer de plusieurs jours pour les États-Unis. Vérifiez les prix sur son site.</td></tr><tr><td>Freedom</td><td>Les forfaits admissibles incluent les États-Unis. Vérifiez le tarif de votre forfait.</td><td>Les pays et données de votre forfait. Un ancien forfait n’a pas nécessairement les avantages actuels.</td></tr></tbody></table>'
  ];
  return {
    lang, checked:lang==='fr'?'septembre 2026':'September 2026', slug, eyebrow:fr ? 'Conduire à l’étranger' : 'Driving abroad', title, h1:title,
    // Evidence: carrier URLs in the dated table. Compatibility/coverage caveat is essential.
    lede:fr ? 'Votre cellulaire peut fonctionner de l’autre côté de la frontière si l’appareil et le forfait sont compatibles. Vérifiez la couverture et le prix pour votre ligne avant de partir. Le nom du fournisseur ne suffit pas.' : 'Your phone can work across the border if the device and plan support it. Check coverage and the price for your particular line before leaving. The carrier’s name alone does not answer the question.',
    sections:[
      section(lang,['Check the plan, then the daily option','Vérifiez le forfait, puis l’option quotidienne'],planBody,canada ? ['verizon','attPlans','attPass','tmPlans','tmPass'] : ['rogers','bell','bellFAQ','telus','freedom']),
      section(lang,['What starts a charge?','Qu’est-ce qui déclenche les frais?'],canada ? [
        '<p>Verizon TravelPass can start when you call, send a text or use data, including background app data. AT&amp;T charges its pass for qualifying usage in a 24-hour period. Turning off data roaming alone does not block voice calls or every possible charge.</p><p>Read the high-speed allowance and long-stay terms. T-Mobile says these benefits are not for extended international use. Check the extended-use limit for your plan.</p>',
        '<p>Un appel, un texto envoyé ou des données, y compris celles utilisées en arrière-plan, peuvent déclencher Verizon TravelPass. AT&amp;T facture son option selon l’utilisation admissible par période de 24 heures. Désactiver les données en itinérance ne bloque pas les appels ni tous les frais possibles.</p><p>Lisez les limites de données à haute vitesse et les conditions des longs séjours. T-Mobile précise que ces avantages ne visent pas un usage international prolongé. Cette formulation ne donne pas un nombre fixe de jours.</p>'
      ] : [
        '<p>Bell says avoiding its roaming charge means turning off data roaming and not making or answering calls or sending texts. Airplane mode is another option.</p><p>Do not treat every carrier’s “day” as 24 hours from arrival. Bell’s daily period ends at 11:59 p.m. Eastern. Check the clock, activation trigger and expiry for the exact pass you buy.</p>',
        '<p>Bell indique que, pour éviter ses frais d’itinérance, il faut désactiver les données en itinérance, ne pas faire ni recevoir d’appels et ne pas envoyer de textos. Le mode avion est une autre option.</p><p>Une « journée » ne signifie pas toujours 24 heures après l’arrivée. Chez Bell, la période quotidienne finit à 23 h 59, heure de l’Est. Vérifiez le déclenchement et l’expiration de l’option choisie.</p>'
      ],canada ? ['verizon','attPass','tmPlans'] : ['bellFAQ']),
      section(lang,['The network can change before the border','Le réseau peut changer avant la frontière'],[
        '<p>Your phone can connect to the other country’s network near the border. Bell explicitly warns about Canadian phones picking up a US network while still in Canada. Check the displayed network rather than waiting for the customs booth.</p><p>If you do not want cellular roaming, change the settings before approaching the border. Ask your carrier about manual home-network selection. It can leave you without ordinary service when that network is out of range.</p>',
        '<p>Près de la frontière, votre cellulaire peut se connecter au réseau de l’autre pays. Bell avertit qu’un appareil peut capter un réseau américain même s’il est encore au Canada. Vérifiez le réseau affiché sans attendre le poste frontalier.</p><p>Si vous ne voulez pas d’itinérance cellulaire, changez les réglages avant d’approcher de la frontière. Demandez à votre fournisseur comment sélectionner manuellement son réseau. Vous pourriez perdre le service ordinaire hors de sa portée.</p>'
      ],['bellFAQ']),
      section(lang,['Airplane mode and Wi-Fi','Le mode avion et le Wi-Fi'],[
        '<p>For a Wi-Fi-only trip, turn on airplane mode and then enable Wi-Fi. Check that cellular service remains off, including any second SIM. This also means ordinary cellular calls and texts will not arrive.</p><p>Do not assume your carrier’s Wi-Fi Calling is an internet call with no charge. Check its billing rules or use an internet messaging app over Wi-Fi. Turn airplane mode off if you need to attempt a cellular emergency call.</p>',
        '<p>Pour utiliser seulement le Wi-Fi, activez le mode avion, puis le Wi-Fi. Vérifiez que le service cellulaire reste désactivé, y compris sur une deuxième carte SIM. Les appels et textos cellulaires ordinaires ne seront alors pas reçus.</p><p>Les appels Wi-Fi de votre fournisseur ne sont pas automatiquement sans frais. Vérifiez leur tarification ou utilisez une application de messagerie par Internet sur le Wi-Fi. Désactivez le mode avion pour tenter un appel d’urgence sur le réseau cellulaire.</p>'
      ],['bellFAQ']),
      section(lang,['Download the route before leaving','Téléchargez la carte avant de partir'],[
        `<p>In Google Maps, download the full driving area while online. Offline driving navigation needs the route inside the downloaded area. Offline maps do not supply live traffic or alternative routes.</p><p>Save your accommodation address and the ${canada ? 'kilometre-marker guide for your route' : local('what-is-my-mile-marker/','mile-marker guide')}. Read ${pageLink(lang,canada ? 'drive-into-canada' : 'drive-into-us-from-canada','the border-crossing checklist')} before leaving.</p>`,
        `<p>Dans Google Maps, téléchargez toute la zone de conduite pendant que vous êtes connecté. L’itinéraire doit se trouver dans la zone téléchargée pour la navigation hors connexion. Les cartes hors connexion ne donnent ni circulation en direct ni itinéraires de rechange.</p><p>Enregistrez l’adresse de votre hébergement et ${canada ? 'le guide des bornes kilométriques de votre trajet' : local('what-is-my-mile-marker/','le guide des bornes en milles (en anglais)')}. Consultez ${pageLink(lang,canada ? 'drive-into-canada' : 'drive-into-us-from-canada','la liste pour traverser la frontière')} avant le départ.</p>`
      ],['maps']),
      section(lang,['911 still needs a connection','Le 911 a quand même besoin d’une connexion'],canada ? [
        `<p>The CRTC says a cellphone without a service subscription can still reach basic wireless 911. That does not create coverage where no compatible network is reachable. Do not rely on any handset working everywhere.</p><p>In an emergency, try 911. Give your location in words, including the road, direction and a known marker. ${local('report-location/','Prepare those details before you need them')}.</p>`,
        `<p>Le CRTC indique qu’un cellulaire sans abonnement peut quand même accéder au service 9-1-1 sans fil de base. Cela ne crée pas de couverture là où aucun réseau compatible n’est accessible. Aucun appareil n’est garanti de fonctionner partout.</p><p>En cas d’urgence, tentez le 911. Décrivez votre emplacement avec le numéro de route, la direction et une borne connue. ${local('report-location/','Préparez ces renseignements avant d’en avoir besoin (en anglais)')}.</p>`
      ] : [
        `<p>The National 911 Program says phones without an active service plan can call 911. They still need a usable network connection. Without active service, the call centre may not get your location and cannot call you back.</p><p>Give the road number, direction and known mile marker or exit. ${local('report-location/','Read the location-reporting guide')}. A mile-marker app does not place the emergency call for you.</p>`,
        `<p>Le programme national américain du 911 indique qu’un téléphone sans forfait actif peut appeler le 911. Il faut quand même une connexion réseau utilisable. Sans service actif, le centre peut ne pas recevoir votre emplacement et ne peut pas vous rappeler.</p><p>Donnez le numéro de route, la direction et la borne en milles ou la sortie connue. Consultez ${local('report-location/','le guide pour décrire votre emplacement (en anglais)')}. Une application de bornes ne fait pas l’appel d’urgence à votre place.</p>`
      ],canada ? ['crtc'] : ['us911']),
    ],
    // FAQ claims inherit the carrier, Google and emergency-service sources above, reviewed Sept 24–25.
    faq:fr ? [
      ['Mon fournisseur suffit-il pour connaître le prix?', 'Non. Vérifiez le forfait et les options de votre ligne.'],
      ['Désactiver les données en itinérance bloque-t-il tous les frais?', 'Non. Les appels et les textos peuvent aussi être facturés.'],
      ['Puis-je capter un réseau étranger avant de traverser?', 'Oui. Vérifiez le réseau affiché près de la frontière.'],
      ['Puis-je utiliser le Wi-Fi en mode avion?', 'Oui. Activez le Wi-Fi et vérifiez que le service cellulaire reste désactivé.'],
      ['Une carte téléchargée donne-t-elle la circulation en direct?', 'Non. Les cartes hors connexion de Google Maps ne fournissent pas la circulation en direct.'],
      ['Le 911 fonctionne-t-il sans réseau?', 'Un appel cellulaire au 911 exige une connexion utilisable. L’absence d’abonnement et l’absence de couverture sont deux situations différentes.'],
    ] : [
      ['Does the carrier name tell you the price?', 'No. Check the plan and add-ons on your particular line.'],
      ['Does switching off data roaming stop every charge?', 'No. Calls and texts can also be charged.'],
      ['Can you roam before physically crossing?', 'Yes. Check the network displayed near the border.'],
      ['Can you use Wi-Fi in airplane mode?', 'Yes. Enable Wi-Fi and check that cellular service stays off.'],
      ['Do downloaded maps include live traffic?', 'No. Google Maps offline areas do not provide live traffic.'],
      ['Does 911 work with no network?', 'A cellular 911 call needs a usable connection. Having no subscription is different from having no coverage.'],
    ], related:related(lang),
  };
}

module.exports = [intoCanada('en'), intoUS('en'), intoUS('fr'), intoCanada('fr'), phone('en','canada'), phone('fr','canada'), phone('en','us'), phone('fr','us')];
