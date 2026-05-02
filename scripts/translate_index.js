/**
 * FANTASY Bot — Translation Script
 * Translates all English ephemeral reply content strings to Arabic (no emojis)
 * Run once with: node scripts/translate_index.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.js');
let src = fs.readFileSync(FILE, 'utf8');
let count = 0;

function rep(from, to) {
    if (!src.includes(from)) return;
    src = src.split(from).join(to);
    count++;
}

/* ── menuHandlers content strings ─────────────────────────────────────── */
rep(
    `'🪪 **Identity** — Type \`/identity\` to view your character and IBAN.'`,
    `'الهوية — اكتب \`/identity\` لعرض شخصيتك وآيبانك.'`
);
rep(
    `'📱 **Phone** — Type \`/phone\` to send a police report 🚨 or ambulance report 🚑.'`,
    `'الهاتف — اكتب \`/phone\` لإرسال بلاغ للشرطة أو الإسعاف.'`
);
rep(
    `'🎒 **Bag** — Type \`/bag\` to view your items. To transfer an item: \`-نقل [item] @user\`'`,
    `'الحقيبة — اكتب \`/bag\` لعرض أغراضك. لتحويل غرض: \`-نقل [item] @user\`'`
);
rep(
    `'🏦 **Bank** — Type \`/bank\` to view your balance and IBAN. To transfer money: \`-تحويل [IBAN] [amount]\`'`,
    `'البنك — اكتب \`/bank\` لعرض رصيدك وآيبانك. لتحويل المال: \`-تحويل [IBAN] [amount]\`'`
);
rep(
    `'✈️ **Trips** — Type \`/الرحلات\` to open a trip or send an Alert.'`,
    `'الرحلات — اكتب \`/الرحلات\` لفتح رحلة أو إرسال تنبيه.'`
);
rep(
    `'💼 **Jobs** — Type \`/jobs\` to choose your job (fishing, taxi, hunting, mining).'`,
    `'الوظائف — اكتب \`/jobs\` لاختيار وظيفتك (صيد، تاكسي، صيد بري، تعدين).'`
);
rep(
    `'🛒 **Tools Market** — Type \`/market\` to buy a fishing rod, axe, or mining tools.'`,
    `'سوق الأدوات — اكتب \`/market\` لشراء سنارة أو فأس أو أدوات تعدين.'`
);
rep(
    `'⚖️ **Law** — Type \`/law\` to open a case or manage cases.'`,
    `'القانون — اكتب \`/law\` لرفع قضية أو إدارة القضايا.'`
);
rep(
    `'🛡️ **Admin** — Type \`/admin\` to view the admin dashboard.'`,
    `'الإدارة — اكتب \`/admin\` لعرض لوحة الإدارة.'`
);
rep(
    `'🔫 **Crimes** — Type \`/crime\` to commit a crime.'`,
    `'الجرائم — اكتب \`/crime\` لتنفيذ جريمة.'`
);
rep(
    `'🎫 **Tickets** — Type \`/tickets\` to open a ticket (complaint, suggestion, report).'`,
    `'التكتات — اكتب \`/tickets\` لفتح تكت (شكوى، اقتراح، بلاغ).'`
);
rep(
    `'🚗 **Cars & Showroom**\\n• \`/سيارات\` — Your registered cars\\n• \`/معارض\` — View the showroom\\n• \`/اضافة-معرض\` — Add a car to the showroom'`,
    `'السيارات والمعرض:\\n• \`/سيارات\` — سياراتك المسجلة\\n• \`/معارض\` — عرض المعرض\\n• \`/اضافة-معرض\` — إضافة سيارة للمعرض'`
);
rep(
    `'💬 **Messages**\\n• \`-رسالة @user [text]\` — Send a message\\n• \`-صندوق\` — View your inbox\\n• \`-جهات @user [name]\` — Add a contact\\n• \`-جهات\` — View contacts'`,
    `'الرسائل:\\n• \`-رسالة @user [text]\` — إرسال رسالة\\n• \`-صندوق\` — عرض صندوق الوارد\\n• \`-جهات @user [name]\` — إضافة جهة اتصال\\n• \`-جهات\` — عرض جهات الاتصال'`
);
rep(
    `'𝕏 **X Platform**\\n• \`-تغريد [text]\` — Post a tweet\\n• \`/منصة-x\` — View posts\\n• \`-حذف-تغريدة [number]\` — Delete your tweet'`,
    `'منصة X:\\n• \`-تغريد [text]\` — نشر تغريدة\\n• \`/منصة-x\` — عرض المنشورات\\n• \`-حذف-تغريدة [number]\` — حذف تغريدتك'`
);
rep(
    `'🏅 **View Ranks** — Contact Admin to view your current rank.'`,
    `'عرض الرتب — تواصل مع الإدارة لعرض رتبتك الحالية.'`
);
rep(
    `'⭐ **Admin Points** — Contact Admin to check your points.'`,
    `'نقاط الإدارة — تواصل مع الإدارة للاطلاع على نقاطك.'`
);
rep(
    `'👥 **Player Management** — Admin-only permission.'`,
    `'إدارة اللاعبين — صلاحيات الإدارة فقط.'`
);
rep(
    `'📋 **Action Log** — Log of all administrative actions.'`,
    `'سجل الأحداث — سجل جميع الإجراءات الإدارية.'`
);
rep(
    `'🎣 **Fishing Rod** — Contact Admin to purchase a fishing rod.'`,
    `'سنارة الصيد — تواصل مع الإدارة لشراء سنارة.'`
);
rep(
    `'🪓 **Axe** — Contact Admin to purchase an axe.'`,
    `'فأس — تواصل مع الإدارة لشراء فأس.'`
);
rep(
    `'⛏️ **Mining Tools** — Contact Admin to purchase mining tools.'`,
    `'أدوات التعدين — تواصل مع الإدارة لشراء أدوات تعدين.'`
);
rep(
    `'🔨 **Auction** — Contact Admin to attend a car and property auction.'`,
    `'المزاد — تواصل مع الإدارة للمشاركة في مزاد السيارات والعقارات.'`
);
rep(
    `'🏥 **Hospital Resuscitation** — Contact the hospital staff to revive you.'`,
    `'إنعاش المستشفى — تواصل مع طاقم المستشفى لإنعاشك.'`
);
rep(
    `'💀 **Decay** — Your character is in decay state. Contact Admin.'`,
    `'التحلل — شخصيتك في حالة تحلل. تواصل مع الإدارة.'`
);
rep(
    `'🧙 **Witch Resuscitation** — Contact the witch for a revival.'`,
    `'إنعاش الساحرة — تواصل مع الساحرة للإنعاش.'`
);
rep(
    `'📋 **Complaint** — Write the details of your complaint and send it to management.'`,
    `'شكوى — اكتب تفاصيل شكواك وأرسلها للإدارة.'`
);
rep(
    `'💡 **Suggestion** — Write your suggestion and it will be reviewed.'`,
    `'اقتراح — اكتب اقتراحك وسيتم مراجعته.'`
);
rep(
    `'🚨 **Report** — Write the details of the report with evidence and send it to management.'`,
    `'بلاغ — اكتب تفاصيل البلاغ مع الأدلة وأرسله للإدارة.'`
);
rep(
    `'❓ **Inquiry** — Write your inquiry and you will receive a reply.'`,
    `'استفسار — اكتب استفسارك وستتلقى رداً.'`
);

/* ── Template literal reply strings ──────────────────────────────────── */
rep(
    '`✅ Retweeted in <#${xChannelId}>`',
    '`تم إعادة التغريدة في <#${xChannelId}>`'
);
rep(
    '`✅ Your tweet has been posted in <#${xChannelId}>`',
    '`تم نشر تغريدتك في <#${xChannelId}>`'
);
rep(
    '`✅ Your reply has been posted in <#${xChannelId}>`',
    '`تم نشر ردك في <#${xChannelId}>`'
);
rep(
    '`❌ You already have an account: **${acc.snap_username}**`',
    '`لديك حساب سناب مسبقاً: **${acc.snap_username}**`'
);
rep(
    '`❌ You already have an account: **@${existing.x_username}**`',
    '`لديك حساب X مسبقاً: **@${existing.x_username}**`'
);
rep(
    "'❌ **Login is currently closed.**\\nYou can only log in when a trip is open. Wait for an admin announcement.'",
    "'تسجيل الدخول مغلق حالياً.\\nيمكنك الدخول فقط عندما تكون رحلة مفتوحة. انتظر إعلان المشرف.'"
);
rep(
    "'🔒 **Character 3** is not unlocked. Contact admins to unlock it.'",
    "'الشخصية الثالثة غير مفعلة. تواصل مع الإدارة لفتحها.'"
);
rep(
    '`❌ **${NAMES[slot]}** is already filled and a new identity cannot be created in it.`',
    '`**${NAMES[slot]}** ممتلئة بالفعل ولا يمكن إنشاء هوية جديدة فيها.`'
);
rep(
    '`⏳ **Your identity request \\`#${pending.id}\\` has been submitted for review.**\\nYou will receive a response when it is approved or rejected.`',
    '`تم إرسال طلب هويتك رقم \\`#${pending.id}\\` للمراجعة.\\nستتلقى رداً عند الموافقة أو الرفض.`'
);
rep(
    '`⏳ It is not yet time to claim fees — **${DAYS_REQUIRED - daysPassed} day(s)** remaining.`',
    '`لم يحن وقت المطالبة بالأتعاب — تبقى **${DAYS_REQUIRED - daysPassed} يوم/أيام**.`'
);
rep(
    '`✅ Custom **${labels[type]}** message saved.`',
    '`تم حفظ رسالة **${labels[type]}** المخصصة.`'
);
rep(
    '`🔄 **${labels[type]}** message reset to default.`',
    '`تمت إعادة رسالة **${labels[type]}** إلى الافتراضية.`'
);
rep(
    '`✅ Priority button **${label}** added (ID: ${btn.id})`',
    '`تم إضافة زر الأولوية **${label}** (المعرف: ${btn.id})`'
);
rep(
    '`✅ **Your activation request has been submitted successfully!**\\n> 🎮 **Sony ID:** \\`${sonyId}\\`\\n> Wait for admin approval.`',
    '`تم إرسال طلب التفعيل بنجاح!\\nمعرف سوني: \\`${sonyId}\\`\\nانتظر موافقة المشرف.`'
);
rep(
    '`⏳ **Your company founding request for «${compName}» (Request \\`#${pending.id}\\`) has been sent to the Ministry of Commerce.**\\nYou will receive a response when it is approved or rejected.`',
    '`تم إرسال طلب تأسيس شركة «${compName}» (طلب رقم \\`#${pending.id}\\`) إلى وزارة التجارة.\\nستتلقى رداً عند الموافقة أو الرفض.`'
);
rep(
    '`🪛 You gathered **${amount}x ${picked.emoji} ${picked.name}** and added them to your bag!`',
    '`جمعت **${amount}x ${picked.emoji} ${picked.name}** وأضفتها إلى حقيبتك!`'
);
rep(
    '`❌ No account found with the name **${friendName}**.`',
    '`لا يوجد حساب باسم **${friendName}**.`'
);
rep(
    '`❌ You are already associated with company **${existingComp.name}**. You cannot found another company.`',
    '`أنت مرتبط بالفعل بشركة **${existingComp.name}**. لا يمكنك تأسيس شركة أخرى.`'
);
rep(
    '`❌ You are already linked to company **${existingComp.name}**.`',
    '`أنت مرتبط بالفعل بشركة **${existingComp.name}**.`'
);
rep(
    "`❌ Insufficient cash. You need **${Number(item.price).toLocaleString('en-US')}$** and you have **${cash.toLocaleString('en-US')}$**.",
    "`رصيدك غير كافٍ. تحتاج **${Number(item.price).toLocaleString('en-US')}$** ولديك **${cash.toLocaleString('en-US')}$**."
);
rep(
    '`❌ Insufficient cash. You need **${Number(item.price).toLocaleString()} Riyals** and you have **${cash.toLocaleString()} Riyals`.',
    '`رصيدك غير كافٍ. تحتاج **${Number(item.price).toLocaleString()} ريال** ولديك **${cash.toLocaleString()} ريال`.'
);
rep(
    '`❌ Insufficient cash. You have \\`${Number(identity.cash).toLocaleString()} Riyals\\` and the property costs \\`${price.toLocaleString()} Riyals\\`.',
    '`رصيدك غير كافٍ. لديك \\`${Number(identity.cash).toLocaleString()} ريال\\` وسعر العقار \\`${price.toLocaleString()} ريال\\`.'
);
rep(
    '`❌ You need **${job.req}** in your bag to perform this job.`',
    '`تحتاج **${job.req}** في حقيبتك لأداء هذه المهمة.`'
);
rep(
    '`⏳ You must wait **${remaining} seconds** before performing this job again.`',
    '`انتظر **${remaining} ثانية** قبل أداء هذه المهمة مجدداً.`'
);
rep(
    '`❌ Invalid duration format. Example: \\`30m\\`, \\`2h\\`, or \\`7d\\``',
    '`صيغة المدة غير صحيحة. مثال: \\`30m\\` أو \\`2h\\` أو \\`7d\\``'
);
rep(
    '`⏳ You will be revived via ${label} in **30 seconds**...`',
    '`سيتم إنعاشك عبر ${label} خلال 30 ثانية...`'
);
rep(
    '`⏳ Decay will begin in **5 minutes**...`',
    '`سيبدأ التحلل خلال 5 دقائق...`'
);
rep(
    '`❌ **You do not have enough resources to craft ${weapon.name}**\\n${missing.join(\'\\n\')}`,',
    '`ليس لديك موارد كافية لصنع ${weapon.name}\\n${missing.join(\'\\n\')}`,',
);
rep(
    "'✅ Trip start notification sent.'",
    "'تم إرسال إشعار بداية الرحلة.'"
);
rep(
    "'⚠️ Trip opened but message could not be sent — check the bot\\'s permissions in the channel.'",
    "'فُتحت الرحلة لكن تعذر إرسال الرسالة — تحقق من صلاحيات البوت في القناة.'"
);
rep(
    "'⚠️ An active Hurricane is in effect — Renew is not possible. Please open a new trip first via the **Start Trip** button.'",
    "'هناك إعصار نشط — التجديد غير ممكن. افتح رحلة جديدة أولاً عبر زر بدء الرحلة.'"
);
rep(
    "'❌ No trip is currently open — you must Start Trip first before Renewing.'",
    "'لا توجد رحلة مفتوحة حالياً — يجب بدء الرحلة أولاً قبل التجديد.'"
);
rep(
    "'✅ Renewal notification sent.'",
    "'تم إرسال إشعار التجديد.'"
);
rep(
    "'⚠️ Renewal recorded but message could not be sent — check the bot\\'s permissions in the channel.'",
    "'تم تسجيل التجديد لكن تعذر إرسال الرسالة — تحقق من صلاحيات البوت في القناة.'"
);
rep(
    "'❌ An error occurred: '",
    "'حدث خطأ: '"
);
rep(
    "'❌ Trip start channel has not been set. Use `/إعداد-رحلات` first.'",
    "'قناة بداية الرحلة لم تُحدد. استخدم `/إعداد-رحلات` أولاً.'"
);
rep(
    '`✅ ${isPolice ? \'Police report\' : \'Ambulance report\'} submitted successfully.`',
    '`تم إرسال البلاغ بنجاح.`'
);
rep(
    "'❌ No data found for this citizen.'",
    "'لا توجد بيانات لهذا المواطن.'"
);

/* ── Simple single-quoted reply strings ───────────────────────────────── */
// Long/specific first to avoid accidental partial matches
rep("'❌ You do not have a Snap account. Create one first.'", "'ليس لديك حساب سناب. أنشئ حساباً أولاً.'");
rep("'❌ You have no friends yet. Add a friend first.'", "'ليس لديك أصدقاء بعد. أضف صديقاً أولاً.'");
rep("'📸 **Choose the friend you want to send a snap to:**'", "'اختر الصديق الذي تريد إرسال سناب إليه:'");
rep("'❌ You do not have an X Platform account. Create one first.'", "'ليس لديك حساب في منصة X. أنشئ حساباً أولاً.'");
rep("'❌ You do not have an X Platform account.'", "'ليس لديك حساب في منصة X.'");
rep("'❌ Your bag is empty, nothing to use.'", "'حقيبتك فارغة، لا يوجد شيء للاستخدام.'");
rep("'✅ **Choose the item you want to use:**'", "'اختر الغرض الذي تريد استخدامه:'");
rep("'❌ Request not found or has expired.'", "'الطلب غير موجود أو انتهت صلاحيته.'");
rep("'❌ This request is not addressed to you.'", "'هذا الطلب ليس موجهاً إليك.'");
rep("'❌ This request has already been processed.'", "'تمت معالجة هذا الطلب بالفعل.'");
rep("'❌ Request not found or already processed.'", "'الطلب غير موجود أو تمت معالجته بالفعل.'");
rep("'❌ You are not the lawyer of this case.'", "'أنت لست المحامي في هذه القضية.'");
rep("'❌ This button no longer exists.'", "'هذا الزر لم يعد موجوداً.'");
rep("'❌ Priority channel has not been set yet.'", "'قناة الأولوية لم تُحدد بعد.'");
rep("'❌ Priority channel not found.'", "'قناة الأولوية غير موجودة.'");
rep("'✅ Sent successfully.'", "'تم الإرسال بنجاح.'");
rep("'You are not logged in. Please log in first.'", "'أنت لست مسجل الدخول. سجل الدخول أولاً.'");
rep("'❌ Car not found or has been sold.'", "'السيارة غير موجودة أو تم بيعها.'");
rep("'❌ This equipment is no longer available.'", "'هذه المعدة لم تعد متاحة.'");
rep("'❌ This item is no longer available.'", "'هذا الغرض لم يعد متاحاً.'");
rep("'❌ No created and approved characters yet. Submit an identity request first.'", "'لا توجد شخصيات مُنشأة ومعتمدة بعد. قدم طلب هوية أولاً.'");
rep("'✅ **Choose the character you want to log in with:**'", "'اختر الشخصية التي تريد الدخول بها:'");
rep("'📋 **Choose the character you want to create an identity for:**'", "'اختر الشخصية التي تريد إنشاء هوية لها:'");
rep("'❌ You are not currently logged in with any character.'", "'أنت لست مسجل الدخول بأي شخصية حالياً.'");
rep("'❌ Unauthorized.'", "'غير مصرح.'");
rep("'❌ This robbery option is no longer available.'", "'خيار السرقة هذا لم يعد متاحاً.'");
rep("'An error occurred while executing the robbery.'", "'حدث خطأ أثناء تنفيذ العملية.'");
rep("'❌ Friend account not found.'", "'حساب الصديق غير موجود.'");
rep("'❌ Request not found.'", "'الطلب غير موجود.'");
rep("'📋 No cases filed under your name.'", "'لا توجد قضايا مسجلة باسمك.'");
rep("'❌ No certified lawyers available currently. Contact an Admin.'", "'لا يوجد محامون معتمدون حالياً. تواصل مع الإدارة.'");
rep("'❌ No open cases filed under your name.'", "'لا توجد قضايا مفتوحة مسجلة باسمك.'");
rep("'👨\u200d⚖️ **Step 1:** Choose the case:'", "'الخطوة الأولى: اختر القضية:'");
rep("'📋 No cases in this status.'", "'لا توجد قضايا في هذه الحالة.'");
rep("'❌ Judge not found.'", "'القاضي غير موجود.'");
rep("'❌ Lawyer not found.'", "'المحامي غير موجود.'");
rep("\"❌ You cannot access another lawyer's dashboard.\"", "'لا يمكنك الوصول إلى لوحة محامٍ آخر.'");
rep("'❌ You are not registered as a certified lawyer.'", "'أنت غير مسجل كمحامٍ معتمد.'");
rep("'❌ No certified lawyers available.'", "'لا يوجد محامون معتمدون.'");
rep("'👨\u200d⚖️ **Step 2:** Choose a lawyer:'", "'الخطوة الثانية: اختر المحامي:'");
rep("'No information available for this option.'", "'لا توجد معلومات لهذا الخيار.'");
rep("'❌ The mention or ID is incorrect.'", "'الإشارة أو المعرف غير صحيح.'");
rep("'❌ You cannot track yourself.'", "'لا يمكنك تتبع نفسك.'");
rep("'⚠️ This person already has an active tracking session.'", "'هذا الشخص لديه جلسة تتبع نشطة بالفعل.'");
rep("'❌ This person is not in the server.'", "'هذا الشخص ليس في السيرفر.'");
rep("'📭 Your portfolio is empty — you have no shares currently.'", "'محفظتك فارغة — ليس لديك أسهم حالياً.'");
rep("'❌ No companies are currently listed on the market.'", "'لا توجد شركات مدرجة في السوق حالياً.'");
rep("'📈 **Choose the company whose shares you want to buy:**'", "'اختر الشركة التي تريد شراء أسهمها:'");
rep("'📉 **Choose the company whose shares you want to sell:**'", "'اختر الشركة التي تريد بيع أسهمها:'");
rep("'❌ You do not have a trade permit. Contact the **Ministry of Commerce** to obtain one.'", "'ليس لديك رخصة تجارية. تواصل مع وزارة التجارة للحصول عليها.'");
rep("'❌ You do not have a registered company. You can submit an establishment request using the button below.'", "'ليس لديك شركة مسجلة. يمكنك تقديم طلب التأسيس بالزر أدناه.'");
rep("'📋 No registered companies found.'", "'لا توجد شركات مسجلة.'");
rep("'❌ Only points admins can use this button.'", "'فقط مشرفو النقاط يمكنهم استخدام هذا الزر.'");
rep("'❌ This action is for **Investor** rank holders only.'", "'هذا الإجراء للمستثمرين فقط.'");
rep("'❌ All fields must be filled.'", "'يجب ملء جميع الحقول.'");
rep("'❌ Activation channel has not been set yet. Contact an Admin.'", "'قناة التفعيل لم تُحدد بعد. تواصل مع الإدارة.'");
rep("'❌ Activation channel not found. Contact an Admin.'", "'قناة التفعيل غير موجودة. تواصل مع الإدارة.'");
rep("'❌ An error occurred while submitting the request.'", "'حدث خطأ أثناء إرسال الطلب.'");
rep("'❌ An error occurred while filing the case.'", "'حدث خطأ أثناء رفع القضية.'");
rep("'❌ Reports channel has not been set. Contact an Admin.'", "'قناة البلاغات لم تُحدد. تواصل مع الإدارة.'");
rep("'❌ Invalid amount. Enter a positive number.'", "'المبلغ غير صحيح. أدخل عدداً موجباً.'");
rep("'❌ Invalid amount. Enter a whole number.'", "'المبلغ غير صحيح. أدخل عدداً صحيحاً.'");
rep("'❌ Invalid amount.'", "'المبلغ غير صحيح.'");
rep("'❌ An error occurred during the transfer.'", "'حدث خطأ أثناء التحويل.'");
rep("'❌ An error occurred while creating the account.'", "'حدث خطأ أثناء إنشاء الحساب.'");
rep("'❌ Account name must be 3-20 characters with no spaces.'", "'اسم الحساب يجب أن يكون 3-20 حرفاً بدون مسافات.'");
rep("'❌ You cannot add yourself.'", "'لا يمكنك إضافة نفسك.'");
rep("'❌ Account not found.'", "'الحساب غير موجود.'");
rep("'❌ An error occurred while sending the snap.'", "'حدث خطأ أثناء إرسال السناب.'");
rep("'❌ The tweets channel has not been set. Contact the admins.'", "'قناة التغريدات لم تُحدد. تواصل مع الإدارة.'");
rep("'❌ The tweets channel has not been configured.'", "'قناة التغريدات لم تُحدد.'");
rep("'❌ The tweets channel has not been set.'", "'قناة التغريدات لم تُحدد.'");
rep("'❌ Original tweet not found.'", "'التغريدة الأصلية غير موجودة.'");
rep("'❌ An error occurred while posting the tweet.'", "'حدث خطأ أثناء نشر التغريدة.'");
rep("'❌ An error occurred while posting the reply.'", "'حدث خطأ أثناء نشر الرد.'");
rep("'❌ Tweet not found.'", "'التغريدة غير موجودة.'");
rep("'❌ Enter a positive whole number.'", "'أدخل عدداً صحيحاً موجباً.'");
rep("'❌ An error occurred while modifying points.'", "'حدث خطأ أثناء تعديل النقاط.'");
rep("'❌ Panic channel has not been set up. Contact an Admin.'", "'قناة البانيك لم تُحدد. تواصل مع الإدارة.'");
rep("'❌ Channel not found or the bot does not have access to it.'", "'القناة غير موجودة أو البوت لا يملك صلاحية الوصول إليها.'");
rep("'✅ Your location has been sent, help is on the way!'", "'تم إرسال موقعك، المساعدة في الطريق!'");
rep("'❌ An error occurred while sending the location.'", "'حدث خطأ أثناء إرسال الموقع.'");
rep("'❌ This slot is already occupied. Choose another slot.'", "'هذه الخانة محجوزة بالفعل. اختر خانة أخرى.'");
rep("'❌ An error occurred while executing the command!'", "'حدث خطأ أثناء تنفيذ الأمر!'");
rep("'❌ You are not linked to any company.'", "'أنت غير مرتبط بأي شركة.'");
rep("'❌ Only the owner and manager can withdraw funds.'", "'فقط المالك والمدير يمكنهما السحب.'");
rep("'❌ Invalid rank. Enter: مدير, محاسب, or موظف.'", "'الرتبة غير صحيحة. أدخل: مدير، محاسب، أو موظف.'");
rep("'❌ Invalid salary. Enter a whole number.'", "'الراتب غير صحيح. أدخل عدداً صحيحاً.'");
rep("'❌ You are not the owner of any company.'", "'أنت لست مالك أي شركة.'");
rep("'❌ You cannot assign yourself.'", "'لا يمكنك تعيين نفسك.'");
rep("'❌ This player is not an employee of your company.'", "'هذا اللاعب ليس موظفاً في شركتك.'");
rep("'❌ You cannot fire yourself.'", "'لا يمكنك فصل نفسك.'");
rep("'❌ An error occurred. Make sure the player ID is correct.'", "'حدث خطأ. تأكد من صحة معرف اللاعب.'");
rep("'❌ This player is already an employee. Use the **Promote Employee** button to update their rank and salary.'", "'هذا اللاعب موظف بالفعل. استخدم زر ترقية الموظف لتحديث رتبته وراتبه.'");
rep("'❌ Your trade permit has expired or been revoked. Contact the **Ministry of Commerce**.'", "'رخصة التجارة انتهت صلاحيتها أو سُحبت. تواصل مع وزارة التجارة.'");
rep("'❌ Ministry of Commerce channel has not been set yet. Contact an Admin.'", "'قناة وزارة التجارة لم تُحدد بعد. تواصل مع الإدارة.'");
rep("'✅ Alert sent.'", "'تم إرسال التنبيه.'");
rep("'❌ Alerts channel has not been set. Use `/إعداد-رحلات` first.'", "'قناة التنبيهات لم تُحدد. استخدم `/إعداد-رحلات` أولاً.'");
rep("'❌ Number of shares must be a whole number greater than 0.'", "'عدد الأسهم يجب أن يكون عدداً صحيحاً أكبر من 0.'");
rep("'❌ This company is not listed on the market.'", "'هذه الشركة غير مدرجة في السوق.'");
rep("'❌ You have no earnings from this category in your bag.'", "'ليس لديك أرباح من هذه الفئة في حقيبتك.'");
rep("'❌ This command is for admins only.'", "'هذا الأمر للمشرفين فقط.'");
rep("'❌ You do not have permission to manage player identities.'", "'ليس لديك صلاحية لإدارة هويات اللاعبين.'");
rep("'❌ This button is for Ministry of Commerce admins only.'", "'هذا الزر لمسؤولي وزارة التجارة فقط.'");
rep("'❌ This button is for admins only.'", "'هذا الزر للمشرفين فقط.'");
rep("'❌ An error occurred during the purchase.'", "'حدث خطأ أثناء الشراء.'");
rep("'❌ An error occurred while deleting identities.'", "'حدث خطأ أثناء حذف الهويات.'");
rep("'❌ This character is not approved or incomplete. Cannot log in with it.'", "'هذه الشخصية غير معتمدة أو غير مكتملة. لا يمكن الدخول بها.'");
rep("'An error occurred during login.'", "'حدث خطأ أثناء تسجيل الدخول.'");
rep("'❌ This property is no longer available.'", "'هذا العقار لم يعد متاحاً.'");
rep("'❌ Your active identity was not found.'", "'لم يتم العثور على هويتك الفعّالة.'");
rep("'❌ Invalid option.'", "'خيار غير صحيح.'");
rep("'❌ Unknown option.'", "'خيار غير معروف.'");
rep("'✅ Hurricane warning sent.'", "'تم إرسال تحذير الإعصار.'");
rep("'❌ An error occurred while paying salaries.'", "'حدث خطأ أثناء صرف الرواتب.'");
rep("'❌ An error occurred during crafting.'", "'حدث خطأ أثناء التصنيع.'");
rep("'❌ An error occurred while paying salaries.'", "'حدث خطأ أثناء صرف الرواتب.'");
rep("'❌ Operation cancelled.'", "'تم إلغاء العملية.'");

// CIA
rep("'🔒 This button is for CIA members only.'", "'هذا الزر لأعضاء CIA فقط.'");
rep("'⚠️ You are already logged in.'", "'أنت مسجل الدخول بالفعل.'");
rep("'⚠️ You are not currently logged in.'", "'أنت لست مسجلاً بالدخول حالياً.'");
rep("'🔒 Creating fake IDs is for CIA Chief only.'", "'إنشاء الهويات المزيفة للرئيس فقط.'");
rep("'🔒 Viewing active members is for CIA Chief only.'", "'مشاهدة المباشرين للرئيس فقط.'");
rep("'📭 No CIA members are currently active.'", "'لا يوجد أعضاء CIA مباشرون حالياً.'");
rep("'📭 No registered citizens found.'", "'لا يوجد مواطنون مسجلون.'");
rep("'📭 No citizens found after excluding staff.'", "'لا يوجد مواطنون بعد استثناء الطاقم.'");

// Admins only
rep("'❌ Admins only.'", "'للمشرفين فقط.'");

// Generic errors (last — shortest patterns)
rep("'❄️ Your account is frozen.'", "'حسابك مجمد.'");
rep("'❌ You do not have a Snap account.'", "'ليس لديك حساب سناب.'");
rep("'❌ Case not found.'", "'القضية غير موجودة.'");
rep("'❌ An error occurred.'", "'حدث خطأ.'");
rep("'An error occurred.'", "'حدث خطأ.'");

// reset error in deferred context
rep("{ content: 'An error occurred.' }", "{ content: 'حدث خطأ.' }");

fs.writeFileSync(FILE, src, 'utf8');
console.log(`✅ Done — ${count} replacement groups applied to index.js`);
