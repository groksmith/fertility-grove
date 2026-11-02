# Figma screen inventory

Every screen to rebuild in Figma, each at three artboards: **Desktop 1440 · Tablet 768 · Phone 390**. Artboard names follow `Area / Screen / Size` (for example `App / Home / Phone 390`). "Signed out" screens are captured with no session; the rest as the demo member, Annie. Onboarding uses `?preview=1` to open any step.

States to add on the States page later: account menu open, phone menu sheet, sign-out confirmation, unsaved-changes dialog, empty states (Saved, Messages, Notifications), toasts, the Guide's crisis answer, suspended and restore screens.


## Public

| Screen | Route | Session |
|---|---|---|
| Landing | `/` | Signed out |
| Help | `/help` | Signed out |
| Terms | `/terms` | Signed out |
| Privacy | `/privacy` | Signed out |
| Shared post | `/p/p-1` | Signed out |
| Demo personas | `/demo` | Signed out |

## Auth

| Screen | Route | Session |
|---|---|---|
| Sign in | `/login` | Signed out |
| Create account | `/signup` | Signed out |
| Forgot password | `/forgot-password` | Signed out |
| Reset password | `/reset-password` | Signed out |
| Confirm email | `/confirm-email` | Signed out |
| Beta invite | `/invite/grove-beta` | Signed out |
| Partner invite | `/partner-invite/demo` | Signed out |

## Onboarding

| Screen | Route | Session |
|---|---|---|
| 1 Journey (and health-data consent) | `/onboarding/1?preview=1` | Member |
| 2 Diagnosis | `/onboarding/2?preview=1` | Member |
| 3 About you | `/onboarding/3?preview=1` | Member |
| 4 Looking for | `/onboarding/4?preview=1` | Member |
| 5 Community | `/onboarding/5?preview=1` | Member |
| 6 Profile | `/onboarding/6?preview=1` | Member |
| 7 Connections | `/onboarding/7?preview=1` | Member |
| 8 All set | `/onboarding/8?preview=1` | Member |

## App

| Screen | Route | Session |
|---|---|---|
| Home | `/home` | Member |
| Groups | `/groups` | Member |
| Group | `/groups/g-endo` | Member |
| Post | `/posts/p-1` | Member |
| Write a post | `/posts/new` | Member |
| Success stories | `/stories` | Member |
| Share your story | `/stories/new` | Member |
| Learn | `/learn` | Member |
| Article | `/learn/endometriosis` | Member |
| Grove Guide | `/guide` | Member |
| Appointment questions | `/guide/appointments` | Member |
| AI credits | `/credits` | Member |
| Buy credits | `/credits/checkout` | Member |
| Mentors | `/mentors` | Member |
| Mentor setup | `/mentors/setup` | Member |
| Messages | `/messages` | Member |
| Conversation | `/messages/cv-maya` | Member |
| Notifications | `/notifications` | Member |
| Find people | `/people?q=han` | Member |
| Member profile | `/u/maya_after_endo` | Member |
| Your profile | `/profile` | Member |
| Edit profile | `/profile?edit=1` | Member |
| Saved | `/saved` | Member |
| Family space | `/family` | Member |
| Family note | `/family/notes/fn-1` | Member |
| Settings | `/settings` | Member |
| Settings - Privacy | `/settings#privacy` | Member |
| Help (in app) | `/help` | Member |

49 screens × 3 sizes = 147 artboards.
