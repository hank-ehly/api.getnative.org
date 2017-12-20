/**
 * param-validation
 * api.getnativelearning.com
 *
 * Created by henryehly on 2017/01/22.
 */

const k = require('../config/keys.json');
const validLangCodes = require('../config/application').config.get(k.VideoLanguageCodes);
const GoogleCloudSpeechLanguageCodes = require('./google-cloud-speech-language-codes.json');

const Joi = require('joi');

const regex = {
    email: /[a-z0-9!#$%&\'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*/,
    timeZoneOffset: /^-*[0-9]+$/
};

const schema = {
    users: {
        create: {
            body: {
                email: Joi.string().regex(regex.email).required(),
                password: Joi.string().required().min(8)
            }
        },
        delete: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                reason: Joi.string()
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                email_notifications_enabled: Joi.boolean(),
                browser_notifications_enabled: Joi.boolean(),
                default_study_language_code: Joi.string().lowercase().valid(validLangCodes),
                interface_language_code: Joi.string().lowercase().valid(validLangCodes)
            }
        },
        updatePassword: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                current_password: Joi.string().required(),
                new_password: Joi.string().required().min(8)
            }
        },
        updateEmail: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                email: Joi.string().regex(regex.email).required(),
            }
        },
        me: {
            headers: {
                authorization: Joi.string().required()
            }
        },
        profileImage: {
            headers: {
                authorization: Joi.string().required()
            },
            files: {
                image: Joi.object().required()
            }
        },
        deleteProfileImage: {
            headers: {
                authorization: Joi.string().required()
            }
        }
    },
    auth: {
        confirmRegistrationEmail: {
            body: {
                token: Joi.string().length(32).required()
            }
        },
        confirmEmailUpdate: {
            body: {
                token: Joi.string().length(32).required()
            }
        },
        resendRegistrationConfirmationEmail: {
            body: {
                email: Joi.string().regex(regex.email).required()
            }
        },
        resetPassword: {
            body: {
                password: Joi.string().min(8).required(),
                token: Joi.string().length(32).required()
            }
        },
        sendPasswordResetLink: {
            body: {
                email: Joi.string().regex(regex.email).required()
            }
        },
        sendEmailUpdateConfirmationEmail: {
            body: {
                email: Joi.string().regex(regex.email).required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        }
    },
    categories: {
        create: {
            headers: {
                authorization: Joi.string().required()
            }
        },
        delete: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        index: {
            headers: {
                authorization: Joi.string()
            },
            query: {
                lang: Joi.string().lowercase().valid(validLangCodes),
                require_subcategories: Joi.boolean()
            }
        },
        show: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        }
    },
    categoriesLocalized: {
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                category_id: Joi.number().integer().min(1).required(),
                categories_localized_id: Joi.number().integer().min(1).required()
            },
            body: {
                name: Joi.string().min(1).max(50)
            }
        }
    },
    collocationOccurrences: {
        index: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        show: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            body: {
                ipa_spelling: Joi.string().min(1).max(100)
            }
        }
    },
    genders: {
        index: {
            headers: {
                authorization: Joi.string().required()
            }
        }
    },
    languages: {
        index: {
            headers: {
                authorization: Joi.string().required()
            }
        }
    },
    usageExamples: {
        create: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            body: {
                text: Joi.string().min(1).max(200).required()
            }
        },
        delete: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            body: {
                text: Joi.string().min(1).max(200)
            }
        }
    },
    sessions: {
        create: {
            body: {
                email: Joi.string().regex(regex.email).required(),
                password: Joi.string().required().min(8)
            }
        }
    },
    speakers: {
        index: {
            headers: {
                authorization: Joi.string().required()
            },
            query: {
                lang: Joi.string().lowercase().valid(validLangCodes)
            }
        },
        create: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                gender_id: Joi.number().integer().min(1).required(),
                localizations: Joi.array().length(validLangCodes.length).items(Joi.object().keys({
                    language_id: Joi.number().integer().min(1).required(),
                    description: Joi.string().min(1).max(1000).required(),
                    location: Joi.string().min(1).max(100).required(),
                    name: Joi.string().min(1).max(100).required()
                })).required()
            }
        },
        delete: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1)
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1)
            },
            body: {
                gender_id: Joi.number().integer().min(1),
                localizations: Joi.array().max(validLangCodes.length).items(Joi.object().keys({
                    id: Joi.number().integer().min(1).required(),
                    description: Joi.string().min(1).max(1000),
                    location: Joi.string().min(1).max(100),
                    name: Joi.string().min(1).max(100)
                }))
            }
        },
        picture: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1)
            },
            files: {
                picture: Joi.object().required()
            }
        },
        show: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            query: {
                lang: Joi.string().lowercase().valid(validLangCodes)
            }
        }
    },
    speakersLocalized: {
        show: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        }
    },
    study: {
        complete: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                id: Joi.number().integer().min(1).required()
            }
        },
        createStudySession: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                video_id: Joi.number().integer().min(1).required(),
                study_time: Joi.number().integer().min(1).required()
            }
        },
        createWritingAnswer: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                study_session_id: Joi.number().integer().min(1).required(),
                writing_question_id: Joi.number().integer().min(1).required(),
                answer: Joi.string().required(),
                word_count: Joi.number().min(0).required()
            }
        },
        stats: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                lang: Joi.string().lowercase().valid(validLangCodes).required()
            }
        },
        writing_answers: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                lang: Joi.string().lowercase().valid(validLangCodes).required()
            },
            query: {
                since: Joi.date().max('now').timestamp('javascript'),
                max_id: Joi.number().integer().min(1),
                time_zone_offset: Joi.string().regex(regex.timeZoneOffset)
            }
        }
    },
    subcategories: {
        create: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        delete: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                category_id: Joi.number().integer().min(1).required(),
                subcategory_id: Joi.number().integer().min(1).required()
            }
        },
        show: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                category_id: Joi.number().integer().min(1).required(),
                subcategory_id: Joi.number().integer().min(1).required()
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                category_id: Joi.number().integer().min(1).required(),
                subcategory_id: Joi.number().integer().min(1).required()
            },
            body: {
                category_id: Joi.number().integer().min(1)
            }
        }
    },
    subcategoriesLocalized: {
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                subcategory_id: Joi.number().integer().min(1).required(),
                subcategories_localized_id: Joi.number().integer().min(1).required()
            },
            body: {
                name: Joi.string().min(1).max(50)
            }
        }
    },
    videos: {
        create: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                youtube_video_id: Joi.string().required(),
                subcategory_id: Joi.number().integer().min(1).required(),
                speaker_id: Joi.number().integer().min(1).required(),
                language_id: Joi.number().integer().min(1).required(),
                is_public: Joi.boolean(),
                localizations: Joi.array().length(validLangCodes.length).items(Joi.object().keys({
                    language_id: Joi.number().integer().min(1).required(),
                    transcript: Joi.string().min(1).required(),
                    writing_questions: Joi.array().items(Joi.object().keys({
                        text: Joi.string().required(),
                        example_answer: Joi.string().required()
                    }))
                })).required()
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            body: {
                subcategory_id: Joi.number().integer().min(1),
                speaker_id: Joi.number().integer().min(1),
                language_id: Joi.number().integer().min(1),
                is_public: Joi.boolean()
            }
        },
        index: {
            headers: {
                authorization: Joi.string()
            },
            query: {
                max_id: Joi.number().integer().min(1),
                category_id: Joi.number().integer().min(1),
                subcategory_id: Joi.number().integer().min(1),
                lang: Joi.string().lowercase().valid(validLangCodes),
                interface_lang: Joi.string().lowercase().valid(validLangCodes),
                count: Joi.number().integer().min(1).max(9),
                q: Joi.string().lowercase().max(100),
                cued_only: Joi.boolean(),
                include_private: Joi.boolean(),
                time_zone_offset: Joi.string().regex(regex.timeZoneOffset)
            }
        },
        show: {
            headers: {
                authorization: Joi.string()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            query: {
                time_zone_offset: Joi.string().regex(regex.timeZoneOffset),
                lang: Joi.string().lowercase().valid(validLangCodes)
            }
        },
        dequeue: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        like: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        queue: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        },
        unlike: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            }
        }
    },
    writingQuestions: {
        index: {
            headers: {
                authorization: Joi.string().required()
            },
            params: {
                id: Joi.number().integer().min(1).required()
            },
            query: {
                count: Joi.number().integer().min(1)
            }
        },
    }
};

module.exports = schema;
