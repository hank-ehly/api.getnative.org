/**
 * param-validation
 * get-native.com
 *
 * Created by henryehly on 2017/01/22.
 */

const Joi = require('joi');

const regex = {
    email: /[a-z0-9!#$%&\'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*/,
    timeZoneOffset: /^-*[0-9]+$/
};

const validLangCodes = ['en', 'ja'];
const GoogleCloudSpeechLanguageCodes = require('./google-cloud-speech-language-codes.json');

module.exports = {
    users: {
        create: {
            body: {
                email: Joi.string().regex(regex.email).required(),
                password: Joi.string().required().min(8)
            }
        },
        update: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                email_notifications_enabled: Joi.boolean(),
                browser_notifications_enabled: Joi.boolean(),
                default_study_language_code: Joi.string().lowercase().valid(validLangCodes)
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
        }
    },
    auth: {
        confirmEmail: {
            body: {
                token: Joi.string().length(32).required()
            }
        },
        resendConfirmationEmail: {
            body: {
                email: Joi.string().regex(regex.email).required()
            }
        }
    },
    categories: {
        create: {
            headers: {
                authorization: Joi.string().required()
            },
            body: {
                name: Joi.string().min(1).max(50).required()
            }
        },
        index: {
            headers: {
                authorization: Joi.string().required()
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
                name: Joi.string().min(1)
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
        writing_questions: {
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
                category_id: Joi.number().integer().min(1),
                name: Joi.string().min(1)
            }
        }
    },
    videos: {
        index: {
            headers: {
                authorization: Joi.string().required()
            },
            query: {
                max_id: Joi.number().integer().min(1),
                category_id: Joi.number().integer().min(1),
                subcategory_id: Joi.number().integer().min(1),
                lang: Joi.string().lowercase().valid(validLangCodes),
                count: Joi.number().integer().min(1).max(9),
                q: Joi.string().lowercase().max(100),
                cued_only: Joi.boolean(),
                time_zone_offset: Joi.string().regex(regex.timeZoneOffset)
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
                time_zone_offset: Joi.string().regex(regex.timeZoneOffset)
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
        transcribe: {
            headers: {
                authorization: Joi.string().required()
            },
            query: {
                language_code: Joi.string().lowercase().valid(GoogleCloudSpeechLanguageCodes)
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
    }
};
