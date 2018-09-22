function AddOrdinalSuffice(number)
{
    var n1 = number % 100;
    if (!(n1 >= 11 && n1 <= 13))
    {
        switch (number % 10)
        {
            case 1:
                return number + "st";
            case 2:
                return number + "nd";
            case 3:
                return number + "rd";
        }
    }
    return number + "th";
}
