function UpdateSpinner(object)
{
    if (object.timer === undefined)
    {
        object.timer = 3 + Math.random() * 3;
    }

    object.timer -= b5.app.dt;
    if (object.timer <= 0)
    {
        object.timer = 3 + Math.random() * 3;
        object._x = Math.random() * 512 - 256;
        object._y = Math.random() * 800 - 400;
        object.playTimeline("show");
    }
}