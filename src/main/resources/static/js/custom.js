const host = 'http://80.90.186.228:8090';
// const host = 'http://localhost:8085';
$(document).ready(function () {

    // elements of forms
    let signInForm = $("form#sign-in");
    let signInWrapper = $("#sign-in-wrapper");
    let signUpForm = $("form#sign-up");
    let signUpWrapper = $("#sign-up-wrapper");

    // element of main board with tasks
    let board = $("#board")
    let newTaskForm = $(".new-task-form");
    let newTaskError = $(".create-new-task-error");

    // sign-in == sign-up === sign-out ref elements
    let signInRef = $("a#sign-in")
    let signUpRef = $("a#sign-up")
    let signInError = $(".sign-in-error")
    let signUpError = $(".sign-up-error")
    let logoutRef = $("#logout")

    if (getJwtFromLocalStorage() !== '' && getJwtFromLocalStorage() !== null) {
        // start page with auth
        if (!isConfirmed()) {
            $("#not-confirmed").show();
            signInWrapper.hide();
            signUpWrapper.hide();
            board.hide();
            ofHeaderNotAuth();
        } else {
            // start page with auth
            signInWrapper.hide();
            signUpWrapper.hide();
            ofHeaderNotAuth();
            onHeaderAuth();
            board.show();
            renderTasksOnBoard();
        }
    } else {
        // start page without auth
        signUpWrapper.hide();
        board.hide();
        ofHeaderAuth();
    }

    const params = new URLSearchParams(window.location.search)
    const confirmToken = params.get("confirm-token")

    // confirm email service
    if (params.has("confirm-token") && !isConfirmed()) {
        if (getJwtFromLocalStorage() === "") {
            // console.log("Please sign in before confirm your email");
            $("#confirm-without-sign-in").show();
        } else {
            // console.log("You are auth and have confirm token")
            $.ajax({
                url: host + `/api/v1/confirmation-email?token=${confirmToken}`,
                type: "get",
                timeout: 10000,
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem("token")
                }
            })
                .done(function (response) {
                    // console.log("confirm successfully")
                    localStorage.setItem('token', response.token);
                    window.location.replace("http://localhost:8080")
                })
                .fail(function (jqXHR, exception) {
                    // console.log("confirm fail")
                    // $("#alert-confirm-without-sign-in").show();
                    $("#alert-confirm-email").show();
                });
        }
    }

    signInRef.click(function (e) {
        e.preventDefault();
        signUpWrapper.hide();
        signInWrapper.show();

    });

    signUpRef.click(function (e) {
        e.preventDefault();
        signInWrapper.hide();
        signUpWrapper.show();
    });

    logoutRef.click(function (e) {
        e.preventDefault();
        localStorage.setItem("token", "");
        onHeaderNotAuth();
        ofHeaderAuth();
        signInWrapper.show()
        board.hide();
        $("#not-confirmed").hide();
    });

    newTaskForm.on("submit", function (e) {
        e.preventDefault();
        const form = $(e.target);
        const json = convertFormToJSON(form);

        $.ajax({
            url: host + "/api/v1/tasks",
            type: "post",
            contentType: "application/json",
            data: JSON.stringify(json),
            timeout: 10000,
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem("token")
            }
        })
            .done(function (response) {
                newTaskError.hide();
                newTaskForm.find('form')[0].reset();
                renderTasksOnBoard();
            })
            .fail(function (jqXHR, data, xdr) {
                newTaskError.show();
            });
    });

    // handler for delete button in small card
    board.on('click', ".card-small-delete", function (e) {
        e.preventDefault();
        $(".modal-delete__alert").remove();
        const id = $(e.target).closest(".card-small").find(".task-hidden-id").text();
        const title = $(e.target).closest(".card-small").find(".card-small__title h6").text();
        const description = $(e.target).closest(".card-small").find(".card-small__description p").text();
        const created = $(e.target).closest(".card-small").find(".card-small__created__date").text();
        const statusId = $(e.target).closest(".card-small").parent().attr('id');
        let status = ""
        if (statusId === "new-tasks-container") {
            status = "New"
        } else {
            status = "Done"
        }

        $(".task-hidden-id input").attr("value", id);
        $("#delete-modal__title").attr("value", title);
        $("#delete-modal__description").text(description);
        $("#delete-modal__created").text(`created: ${created}`);
        if (status === "New") {
            $('#delete-modal__status').prop('checked', false);
        } else {
            $('#delete-modal__status').prop('checked', true);
        }

        $("#overlay-modal").fadeIn(297, function () {
            $("#delete-modal")
                .css("display", "block")
                .animate({opacity: 1}, 198);
        });
    });

    // handler for delete button in delete form
    $(".modal").on("click", ".modal__delete-btn", function (e) {
        const form = $(this).closest(".modal").find("form");
        const task = convertFormToJSON(form);
        deleteTask(task.id)
    });

    // handler for edit button in small card
    board.on('click', ".card-small-edit", function (e) {
        e.preventDefault()
        $(".modal-edit__alert").remove();
        const id = $(e.target).closest(".card-small").find(".task-hidden-id").text();
        const title = $(e.target).closest(".card-small").find(".card-small__title h6").text();
        const description = $(e.target).closest(".card-small").find(".card-small__description p").text();
        const created = $(e.target).closest(".card-small").find(".card-small__created__date").text();
        const statusId = $(e.target).closest(".card-small").parent().attr('id');
        let status = ""
        if (statusId === "new-tasks-container") {
            status = "New"
        } else {
            status = "Done"
        }

        $(".task-hidden-id input").attr("value", id);
        $("#edit-modal__title").attr("value", title);
        $("#edit-modal__description").text(description);
        $("#edit-modal__created").text(`created: ${created}`);
        if (status === "New") {
            $('#edit-modal__status').prop('checked', false);
        } else {
            $('#edit-modal__status').prop('checked', true);
        }

        $("#overlay-modal").fadeIn(297, function () {
            $("#edit-modal")
                .css("display", "block")
                .animate({opacity: 1}, 198);
        });
    });

    // handler for save button in edit form
    $(".modal").on("click", ".modal__save-btn", function (e) {
        const form = $(this).closest(".modal").find("form");
        const task = convertFormToJSON(form);

        $.ajax({
            url: host + "/api/v1/tasks",
            type: "post",
            contentType: "application/json",
            timeout: 10000,
            data: JSON.stringify(task),
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem("token")
            }
        })
            .done(function (response) {
                renderTasksOnBoard();
                showOffModal();
            })
            .fail(function (jqXHR, exception) {
                $(".modal-edit__alert").remove();
                if (jqXHR.status === 401) {
                    $("#edit-modal__content").append(
                        $('<div>').addClass("modal-edit__alert")
                            .append($("<p>")
                                .text(`You are unauthorized, please sign-in again.`)));
                } else {
                    $("#delete-modal__content").append(
                        $('<div>').addClass("modal-edit__alert")
                            .append($("<p>")
                                .text(`You can't deleted this task, something wrong. Try again later.`)));
                }
            });
    });


    // close modal
    $(".modal__close, #overlay-modal").click(function () {
        showOffModal();
    });

    signInForm.on("submit", function (e) {
        e.preventDefault();
        const form = $(e.target);
        const json = convertFormToJSON(form);

        $.ajax({
            url: host + "/api/v1/auth/authenticate",
            type: "post",
            contentType: "application/json",
            dataType: "json",
            timeout: 10000,
            data: JSON.stringify(json),
        })
            .done(function (response) {
                localStorage.setItem('token', response.token);
                signInForm[0].reset();
                signInError.hide();
                signInWrapper.hide();
                $("#confirm-without-sign-in").hide();
                ofHeaderNotAuth();
                onHeaderAuth();

                if (isConfirmed()) {
                    board.show();
                    renderTasksOnBoard();
                } else {
                    $("#not-confirmed").show();
                }

                $("#profile-logo-name").text(getProfileLogoName());

            })
            .fail(function (jqXHR, exception) {
                $("#confirm-without-sign-in").hide();
                if (jqXHR.status === 401) {
                    const errorResponse = JSON.parse(jqXHR.responseText)
                    const message = errorResponse.message;
                    if (message === "UNAUTHORIZED") {
                        // alert("User with that email doesn't exist")
                        signInError.find("p").text("User with such an email doesn't exist");
                    }
                    if (message === "CREDENTIALS_IS_NOT_VALID") {
                        signInError.find("p").text("Password is wrong");
                    }
                } else {
                    signInError.find("p").text("Something wrong. Try again latter...");
                }
                signInError.show();
            });
    });

    signUpForm.on("submit", function (e) {
        e.preventDefault();
        signUpError.hide();
        const form = $(e.target);
        const json = convertFormToJSON(form);
        // console.log(json)

        $.ajax({
            url: host + "/api/v1/auth/register",
            type: "post",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(json),
            timeout: 10000,
        })
            .done(function (response) {
                localStorage.setItem('token', response.token);
                signUpForm[0].reset();
                signUpError.hide();
                signUpWrapper.hide();
                ofHeaderNotAuth();
                onHeaderAuth();

                if (isConfirmed()) {
                    board.show();
                    renderTasksOnBoard();
                } else {
                    $("#not-confirmed").show();
                }

                $("#profile-logo-name").text(getProfileLogoName());

            })
            .fail(function (jqXHR, exception) {
                if (jqXHR.status === 409) {
                    signUpError.find("p").text("User with such an email already exist");
                } else if (jqXHR.status === 400) {
                    signUpError.find("p").text("Password and confirm password are not equal");
                } else {
                    signUpError.find("p").text("Something wrong. Try again latter...");
                }
                signUpError.show();
            });
    });

    // click send email again
    $("#send-email-again").on("click", function (e) {
        e.preventDefault();
        $("#alert-confirm-email").hide();
        // console.log("click send email with confirm again");
        $.ajax({
            url: host + "/api/v1/confirmation-email/send-again",
            type: "get",
            timeout: 10000,
            headers: {
                Authorization: 'Bearer ' + getJwtFromLocalStorage()
            }
        })
            .done(function (response) {
                // console.log("send again successfully")
            })
            .fail(function (exception) {
                // Something wrong. Try again latter...
                // console.log("send again fail")
                $("#alert-confirm-email").show();

            });
    });
})
;

function convertFormToJSON(form) {
    return $(form)
        .serializeArray()
        .reduce(function (json, {name, value}) {
            json[name] = value;
            return json;
        }, {});
}

function ofHeaderAuth() {
    $("#header-have-auth").attr("style", "display: none!important")
}

function onHeaderAuth() {
    $("#header-have-auth").attr("style", "display: flex")
}

function ofHeaderNotAuth() {
    $("#header-havenot-auth").attr("style", "display: none!important")
}

function onHeaderNotAuth() {
    $("#header-havenot-auth").attr("style", "display: block!important")
}

function renderTasksOnBoard() {
    $.ajax({
        url: host + "/api/v1/tasks",
        type: "get",
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem("token")
        }
    }).done(function (response) {
        const arrNew = response.filter((item) => item.done === false);
        const arrDone = response.filter((item) => item.done === true);
        $("#new-task-total-qht").text(`${arrNew.length}`)
        $("#done-task-total-qht").text(`${arrDone.length}`)

        const newTasksContainer = $("#new-tasks-container").empty();
        $.each(arrNew, function (i, task) {
            const card = createTaskCard(task);
            newTasksContainer.append(card);
        });

        const doneTasksContainer = $("#done-tasks-container").empty();
        $.each(arrDone, function (i, task) {
            const card = createTaskCard(task);
            doneTasksContainer.append(card);
        });
    })
        .fail(function () {
            onHeaderNotAuth();
            ofHeaderAuth();
            $("#board").hide();
            $("#sign-in-wrapper").show();
            localStorage.setItem("token", "");
        });
}

function createTaskCard(task) {

    const card = $('<div>').addClass('card-small');

    const title = $('<div>').addClass('card-small__title').append($('<h6>').text(task.title));
    const description = $('<div>').addClass('card-small__description').append($('<p>').text(task.description));

    const prop = $('<div>').addClass('card-small__prop');
    const created = $('<div>').addClass('card-small__prop__created');
    created.append($('<p>').addClass('card-small__created__name').text('created:'));
    created.append($('<p>').addClass('card-small__created__date').text(task.created));

    const service = $('<div>').addClass('card-small__prop__service');
    service.append($('<div>').addClass('card_small__service__btn card-small-delete').append($('<a>').attr("href", "#delete-modal").attr("rel", "modal:open").text('X')));
    service.append($('<div>').addClass('card_small__service__btn card-small-edit').append($('<a>').attr("href", "#edit-modal").attr("rel", "modal:open").text('/')));

    prop.append(created);
    prop.append(service);

    card.append($('<div>').addClass('task-hidden-id').text(task.id));
    card.append(title);
    card.append(description);
    card.append(prop);

    return card;
}

function deleteTask(id) {
    $.ajax({
        url: host + `/api/v1/tasks/${id}`,
        type: "delete",
        contentType: "application/json",
        timeout: 10000,
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem("token")
        }
    })
        .done(function (response) {
            renderTasksOnBoard();
            showOffModal();
        })
        .fail(function (jqXHR, exception) {
            $(".modal-delete__alert").remove();
            if (jqXHR.status === 401) {
                $("#delete-modal__content").append(
                    $('<div>').addClass("modal-delete__alert")
                        .append($("<p>")
                            .text(`You are unauthorized, please sign-in again.`)));
            } else {
                $("#delete-modal__content").append(
                    $('<div>').addClass("modal-delete__alert")
                        .append($("<p>")
                            .text(`You can't deleted this task, something wrong. Try again later.`)));
            }
        });
}

//show of modal
function showOffModal() {
    $(".modal").animate({opacity: 0}, 198, function () {
        $(this).css("display", "none");
        $("#overlay-modal").fadeOut(297);
        $("#edit-modal__form")[0].reset();
        $("#delete-modal__form")[0].reset();
    });
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function getJwtFromLocalStorage() {
    return localStorage.getItem("token")
}

function isConfirmed() {
    return parseJwt(getJwtFromLocalStorage())["confirmed"];
}

function getProfileLogoName() {
    const names = parseJwt(localStorage.getItem("token")).name.split(' ');
    let profileName = "";
    if (names.length > 1) {
        profileName = names[0][0] + names[1][0];
    } else {
        if (names[0].length > 1) {
            profileName = names[0][0] + names[0][1];
        } else {
            profileName = names[0][0];
        }
    }
    return profileName.toUpperCase();
}


